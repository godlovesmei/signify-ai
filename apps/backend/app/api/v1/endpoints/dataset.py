"""Dataset routes, independent from translation/model dependencies."""
from typing import Annotated, Literal
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, Header, Query, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBearer
from pydantic import ValidationError
from app.schemas.dataset import ContributionInput, ContributionReviewInput, CuratorGrantInput, CuratorRevokeInput
from app.services.dataset_errors import DatasetError
from app.services.dataset_service import public_row

def require_verified_actor(request: Request, _credentials=Depends(HTTPBearer(auto_error=False))):
    # Documents Bearer auth and fails closed if the router is mounted without its gate.
    if getattr(request.state, "dataset_actor", None) is None:
        raise DatasetError(401, "authentication_required", "Token pengguna yang valid wajib disertakan.")


router = APIRouter(tags=["dataset"], dependencies=[Depends(require_verified_actor)])


def require_curator(request: Request):
    gateway = request.app.state.dataset_gateway
    access = gateway.access(request.state.dataset_actor.token)
    if not access["is_curator"]:
        raise DatasetError(403, "operation_forbidden", "Akses kurasi tidak diizinkan.")
    if not gateway.settings.review_workflow_ready:
        raise DatasetError(503, "review_unavailable", "Alur peninjauan kurator sedang dinonaktifkan.")


def require_dataset_admin(request: Request):
    if not request.app.state.dataset_gateway.access(request.state.dataset_actor.token)["is_admin"]:
        raise DatasetError(403, "operation_forbidden", "Akses administrator diperlukan.")


@router.get("/api/v1/dataset/access")
def dataset_access(request: Request):
    return request.app.state.dataset_gateway.access(request.state.dataset_actor.token)


@router.get("/api/v1/dataset/curators", dependencies=[Depends(require_dataset_admin)])
def list_curators(request: Request):
    return {"items": request.app.state.dataset_gateway.list_curators(request.state.dataset_actor.token)}


@router.post("/api/v1/dataset/curators", dependencies=[Depends(require_dataset_admin)])
def grant_curator(request: Request, data: CuratorGrantInput):
    return request.app.state.dataset_gateway.grant_curator(request.state.dataset_actor.token, data)


@router.post("/api/v1/dataset/curators/{user_id}/revoke", dependencies=[Depends(require_dataset_admin)])
def revoke_curator(request: Request, user_id: UUID, data: CuratorRevokeInput):
    return request.app.state.dataset_gateway.revoke_curator(request.state.dataset_actor.token, user_id, data)


@router.get("/api/v1/dataset/review-info")
def review_info(request: Request):
    gateway = request.app.state.dataset_gateway
    access = gateway.access(request.state.dataset_actor.token)
    ready = gateway.settings.review_workflow_ready and access["review_available"]
    return {"available": ready, "target_business_days": gateway.settings.review_target_business_days if ready else None,
            "can_review": ready and access["is_curator"]}


@router.get("/api/v1/dataset/review-summary", dependencies=[Depends(require_curator)])
def review_summary(request: Request):
    return request.app.state.dataset_gateway.review_summary(request.state.dataset_actor.token)


@router.get("/api/v1/dataset/review-queue", dependencies=[Depends(require_curator)])
def review_queue(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 10,
                 offset: Annotated[int, Query(ge=0)] = 0, q: Annotated[str, Query(max_length=160)] = "",
                 status: Literal['PENDING', 'APPROVED', 'REJECTED', 'ALL'] = 'PENDING'):
    rows, total = request.app.state.dataset_gateway.review_queue(request.state.dataset_actor.token, limit, offset, q.strip(), status)
    return {"items": [public_row(row) for row in rows[:limit]], "total": total,
            "next_offset": offset + limit if len(rows) > limit else None}


@router.post("/api/v1/dataset/reviews/{contribution_id}", dependencies=[Depends(require_curator)])
def review_contribution(request: Request, contribution_id: UUID, review: ContributionReviewInput):
    # The existing atomic RPC checks the actual database curator grant again,
    # saves the mandatory reason, updates status/revision, and creates the notice.
    return request.app.state.dataset_gateway.review(contribution_id, request.state.dataset_actor.token, review)


@router.get("/api/v1/dataset/labels")
def active_labels(request: Request):
    actor = request.state.dataset_actor
    return {"items": request.app.state.dataset_gateway.labels(actor.token)}


@router.get("/api/v1/dataset/video-policy")
def active_policy(request: Request):
    actor = request.state.dataset_actor
    return request.app.state.dataset_gateway.policy(actor.token).model_dump(mode="json")


@router.post("/api/v1/contributions", status_code=201)
def upload_contribution(request: Request, file: Annotated[UploadFile, File()],
                        metadata: Annotated[str, Form()],
                        idempotency_key: Annotated[str, Header(alias="Idempotency-Key")]):
    try:
        if len(metadata) > 4096:
            raise DatasetError(422, "metadata_too_large", "Metadata terlalu panjang.")
        try:
            parsed = ContributionInput.model_validate_json(metadata)
        except ValidationError:
            raise DatasetError(422, "invalid_metadata", "Label dan persetujuan penggunaan data wajib lengkap.") from None
        policy = request.state.dataset_policy
        if file.size is not None and file.size > policy.max_size_bytes:
            raise DatasetError(413, "video_too_large", "Ukuran video melebihi policy aktif.",
                               details={"size_bytes": file.size, "max_size_bytes": policy.max_size_bytes})
        row, replayed = request.app.state.dataset_service.upload(
            request.state.dataset_actor, file.file, parsed, request.state.dataset_policy, idempotency_key)
        return JSONResponse({"contribution": public_row(row), "replayed": replayed}, status_code=200 if replayed else 201)
    finally:
        file.file.close()


@router.get("/api/v1/contributions")
def list_contributions(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 10,
                       offset: Annotated[int, Query(ge=0)] = 0,
                       status: Literal["PENDING", "APPROVED", "REJECTED"] | None = None,
                       q: Annotated[str, Query(max_length=160)] = ""):
    actor = request.state.dataset_actor
    rows, total = request.app.state.dataset_gateway.list_rows(actor.id, actor.token, limit, offset,
                                                       status=status, search=q.strip())
    return {"items": [public_row(r) for r in rows[:limit]], "total": total,
            "next_offset": offset + limit if len(rows) > limit else None}


@router.get("/api/v1/contributions/summary")
def contribution_summary(request: Request):
    actor = request.state.dataset_actor
    return request.app.state.dataset_gateway.summary(actor.id, actor.token)


@router.get("/api/v1/contributions/{contribution_id}")
def contribution_detail(request: Request, contribution_id: UUID):
    actor = request.state.dataset_actor
    row = request.app.state.dataset_gateway.row(contribution_id, actor.id, actor.token)
    if row is None:
        raise DatasetError(404, "contribution_not_found", "Kontribusi tidak ditemukan.")
    return public_row(row)


@router.post("/api/v1/contributions/{contribution_id}/video-access")
def video_access(request: Request, contribution_id: UUID):
    actor = request.state.dataset_actor
    # Caller JWT + existing RLS authorize the owner or an explicitly assigned curator.
    row = request.app.state.dataset_gateway.row(contribution_id, actor.id, actor.token, owner_only=False)
    if row is None:
        raise DatasetError(404, "contribution_not_found", "Kontribusi tidak ditemukan.")
    return request.app.state.dataset_gateway.video_access(row, actor.token)


@router.get("/api/v1/contributions/{contribution_id}/video")
def video_playback(request: Request, contribution_id: UUID):
    actor = request.state.dataset_actor
    row = request.app.state.dataset_gateway.row(contribution_id, actor.id, actor.token, owner_only=False)
    if row is None:
        raise DatasetError(404, "contribution_not_found", "Kontribusi tidak ditemukan.")
    content, mime = request.app.state.dataset_service.playback(row, actor.token)
    return Response(content, media_type=mime, headers={"Cache-Control": "private, no-store",
                    "X-Content-Type-Options": "nosniff"})
