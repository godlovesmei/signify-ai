import hashlib
from uuid import uuid4
import pytest
from test_dataset_api import setup, token, UID, BUCKET, real_media, FFMPEG


def seed(upstream):
    cid = str(uuid4())
    path = UID + '/' + cid + '/video'
    data = b'synthetic-webm'
    upstream.rows[cid] = {'id': cid, 'user_id': UID, 'video_bucket_id': BUCKET,
        'video_object_path': path, 'size_bytes': len(data), 'source_sha256': hashlib.sha256(data).hexdigest(),
        'mime_type': 'video/webm', 'codec': 'vp8', 'consented_at': '2026-11-12T00:00:00Z', 'consent_version': 'test'}
    upstream.objects[path] = data
    return cid, path, data


def test_playback_is_authenticated_no_store_and_uses_caller_storage_permissions(setup):
    client, app, upstream, _ = setup
    cid, _, data = seed(upstream)
    seen = []
    original = app.state.dataset_gateway.headers
    def headers(caller=None, service=False):
        seen.append((caller, service))
        return original(caller, service)
    app.state.dataset_gateway.headers = headers
    assert client.get('/api/v1/contributions/' + cid + '/video').status_code == 401
    result = client.get('/api/v1/contributions/' + cid + '/video', headers={'Authorization': 'Bearer ' + token()})
    assert result.status_code == 200 and result.content == data
    assert result.headers['cache-control'] == 'private, no-store'
    assert result.headers['content-type'] == 'video/webm'
    assert all(not service and caller for caller, service in seen)


@pytest.mark.parametrize('change', ['consent', 'deleted', 'tampered', 'missing', 'reference'])
def test_playback_denies_invalid_or_unavailable_sources(setup, change):
    client, _, upstream, _ = setup
    cid, path, _ = seed(upstream)
    if change == 'consent': upstream.rows[cid]['consented_at'] = None
    elif change == 'deleted': upstream.rows[cid]['deleted_at'] = '2026-11-12T00:00:00Z'
    elif change == 'tampered': upstream.objects[path] = b'tampered'
    elif change == 'missing': upstream.rows.clear()
    else: upstream.rows[cid]['video_object_path'] = 'invalid'
    result = client.get('/api/v1/contributions/' + cid + '/video', headers={'Authorization': 'Bearer ' + token()})
    assert result.status_code in (403, 404, 422, 503)
    assert 'synthetic-webm' not in result.text


def test_legacy_avi_gets_playable_webm_without_changing_original(real_media):
    inspector, source, _ = real_media
    original = source.read_bytes()
    content, mime = inspector.browser_preview(source)
    assert mime == 'video/webm' and content.startswith(b'\x1a\x45\xdf\xa3')
    assert source.read_bytes() == original


@pytest.mark.parametrize('duration,accepted', [(2.9, False), (3, True), (5, True), (7, True), (7.1, False)])
def test_real_media_duration_is_strictly_3_to_7_seconds(real_media, duration, accepted):
    from app.services.dataset_errors import DatasetError
    inspector, source, policy = real_media
    video = source.parent / 'duration-boundary.avi'
    inspector.run_tool(FFMPEG, ['-v', 'error', '-cpucount', '1', '-f', 'lavfi', '-i', 'color=s=64x48:r=10',
        '-t', str(duration), '-c:v', 'rawvideo', '-threads', '1', str(video)], source.parent, 'generate-boundary')
    policy = policy.model_copy(update={'min_duration_ms': 3000, 'max_duration_ms': 7000})
    if accepted:
        assert inspector.inspect(video, policy)['duration_ms'] == int(duration * 1000)
    else:
        with pytest.raises(DatasetError) as error: inspector.inspect(video, policy)
        assert error.value.code == 'duration_not_allowed'
