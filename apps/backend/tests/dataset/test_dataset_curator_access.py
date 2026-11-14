"""Role separation and access management with caller JWTs, never a service-role bypass."""
import json
from uuid import uuid4
import httpx
import pytest
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings
from dataset_main import create_app
from test_dataset_api import FakeSupabase, SECRET, UID, token


@pytest.fixture
def access_api(tmp_path):
    upstream = FakeSupabase()
    state = {"admin": False, "curator": False, "forbidden": False}
    calls = []
    def handle(request):
        path = request.url.path
        if path.startswith("/rest/v1/rpc/dataset_"):
            assert request.headers["apikey"] == "synthetic-public"
            assert request.headers["Authorization"] == "Bearer " + bearer
            if path.endswith("dataset_access_info"):
                return httpx.Response(200, json={"is_admin": state["admin"], "is_curator": state["curator"], "review_available": state["curator"]})
            calls.append(request)
            if state["forbidden"]:
                return httpx.Response(403,json={"code":"42501"})
            if path.endswith("dataset_list_curators"):
                return httpx.Response(200,json=[])
            return httpx.Response(200,json={"user_id":UID,"active":True})
        if path == "/rest/v1/dataset_contributions":
            calls.append(request)
            assert "user_id" not in request.url.params
            return httpx.Response(200,headers={"Content-Range":"*/13"},json=[])
        return upstream(request)
    bearer=token()
    settings=DatasetSettings(_env_file=None,anon_key="synthetic-public",service_role_key="synthetic-service",jwt_hs256_secret=SECRET,work_dir=tmp_path)
    with TestClient(create_app(settings,httpx.MockTransport(handle))) as client:
        yield client,state,calls,{"Authorization":"Bearer "+bearer}


def test_role_information_requires_authentication(access_api):
    client,_,calls,_=access_api
    assert client.get("/api/v1/dataset/access").status_code==401
    assert not calls


@pytest.mark.parametrize("curator",[False,True])
def test_non_admin_cannot_manage_curator_accounts(access_api,curator):
    client,state,calls,headers=access_api
    state["curator"]=curator
    assert client.get("/api/v1/dataset/curators",headers=headers).status_code==403
    assert client.post("/api/v1/dataset/curators",headers=headers,json={"email":"reviewer@example.test","qualification_note":"Competent reviewer"}).status_code==403
    assert client.post("/api/v1/dataset/curators/"+str(uuid4())+"/revoke",headers=headers,json={"expected_granted_at":"2026-11-11T01:00:00Z"}).status_code==403
    assert not calls


def test_admin_is_not_implicitly_a_curator(access_api):
    client,state,calls,headers=access_api
    state["admin"]=True
    assert client.get("/api/v1/dataset/review-queue",headers=headers).status_code==403
    assert client.get("/api/v1/dataset/review-summary",headers=headers).status_code==403
    assert not calls


def test_admin_grant_and_revoke_use_caller_jwt_and_database_rpc(access_api):
    client,state,calls,headers=access_api
    state["admin"]=True
    assert client.get("/api/v1/dataset/curators",headers=headers).json()=={"items":[]}
    response=client.post("/api/v1/dataset/curators",headers=headers,json={"email":" REVIEWER@example.test ","qualification_note":" Competent reviewer "})
    assert response.status_code==200
    assert json.loads(calls[-1].read())=={"p_email":"reviewer@example.test","p_qualification_note":"Competent reviewer"}
    response=client.post("/api/v1/dataset/curators/"+UID+"/revoke",headers=headers,json={"expected_granted_at":"2026-11-11T01:00:00Z"})
    assert response.status_code==200
    assert json.loads(calls[-1].read())=={"p_user_id":UID,"p_expected_granted_at":"2026-11-11T01:00:00+00:00"}


def test_database_permission_recheck_prevents_a_stale_admin_grant(access_api):
    client,state,calls,headers=access_api
    state.update(admin=True,forbidden=True)
    response=client.post("/api/v1/dataset/curators",headers=headers,json={"email":"reviewer@example.test","qualification_note":"Competent reviewer"})
    assert response.status_code==403 and len(calls)==1


def test_access_revocation_is_seen_by_the_next_request(access_api):
    client,state,calls,headers=access_api
    state["curator"]=True
    assert client.get("/api/v1/dataset/review-queue",headers=headers).status_code==200
    state["curator"]=False
    before=len(calls)
    assert client.get("/api/v1/dataset/review-queue",headers=headers).status_code==403
    assert len(calls)==before


def test_curator_summary_counts_all_visible_candidates_with_exact_counts(access_api):
    client,state,calls,headers=access_api
    state["curator"]=True
    response=client.get("/api/v1/dataset/review-summary",headers=headers)
    assert response.status_code==200 and response.json()=={"total":39,"PENDING":13,"APPROVED":13,"REJECTED":13}
    assert len(calls)==3
    assert all(request.method=="HEAD" and request.headers["Prefer"]=="count=exact" for request in calls)


@pytest.mark.parametrize("payload",[
    {"email":"reviewer@example.test","qualification_note":"   "},
    {"email":"invalid","qualification_note":"Competent reviewer"},
    {"email":"reviewer@example.test","qualification_note":"Competent reviewer","role":"admin"},
])
def test_invalid_assignments_are_rejected_before_the_write_rpc(access_api,payload):
    client,state,calls,headers=access_api
    state["admin"]=True
    assert client.post("/api/v1/dataset/curators",headers=headers,json=payload).status_code==422
    assert not calls


@pytest.mark.parametrize('status', ['PENDING', 'APPROVED', 'REJECTED', 'ALL'])
def test_curator_can_browse_videos_across_all_statuses(access_api, status):
    client,state,calls,headers=access_api
    state['curator']=True
    assert client.get('/api/v1/dataset/review-queue?status='+status,headers=headers).status_code==200
    assert calls
    params=calls[-1].url.params
    assert params.get('status')==('eq.'+status if status!='ALL' else None)
    assert params['order']=='created_at.desc,id.desc'
