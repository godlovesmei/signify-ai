"""Dataset API for hosted production and isolated local development."""
import asyncio
from contextlib import asynccontextmanager
import logging
from pathlib import Path
import sys
import threading
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.api.v1.endpoints.dataset import router
from app.config.dataset_settings import DatasetSettings
from app.services.dataset_auth import DatasetAuth
from app.services.dataset_errors import DatasetError
from app.services.dataset_gateway import DatasetGateway
from app.services.dataset_media import VideoInspector
from app.services.dataset_service import DatasetService

# No URLs with signed query strings or request headers in application logs.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


def error_response(error):
    body = {"code": error.code, "message": error.message, "retryable": error.retryable}
    if error.details is not None:
        body["details"] = error.details
    return JSONResponse({"error": body},
                        status_code=error.status, headers=({"WWW-Authenticate": "Bearer"} if error.status == 401
                        else {"Retry-After": "1"} if error.retryable else {}))


class BodyLimit(HTTPException):
    def __init__(self, max_size_bytes):
        self.max_size_bytes = max_size_bytes
        super().__init__(413, "request_too_large")


class DatasetGate:
    """Authenticate and load policy BEFORE Starlette spools multipart data."""
    def __init__(self, app, auth, gateway, slots):
        self.app, self.auth, self.gateway, self.slots = app, auth, gateway, slots

    async def __call__(self, scope, receive, send):
        protected = scope["type"] == "http" and scope["path"].startswith(("/api/v1/contributions", "/api/v1/dataset"))
        if not protected or scope.get("method") == "OPTIONS":
            return await self.app(scope, receive, send)
        acquired = False
        try:
            headers = {k.lower(): v for k, v in scope["headers"]}
            actor = await asyncio.to_thread(self.auth.authenticate, headers.get(b"authorization", b"").decode("latin1"))
            scope.setdefault("state", {})["dataset_actor"] = actor
            upload = scope["method"] == "POST" and scope["path"].rstrip("/") == "/api/v1/contributions"
            maximum = None
            if upload:
                policy = await asyncio.to_thread(self.gateway.policy, actor.token)
                scope["state"]["dataset_policy"] = policy
                acquired = self.slots.acquire(blocking=False)
                if not acquired:
                    raise DatasetError(429, "upload_capacity", "Kapasitas unggahan sedang penuh.", True)
                maximum = policy.max_size_bytes + 65536  # bounded multipart envelope, not a video rule
                if b"content-length" in headers:
                    try:
                        if int(headers[b"content-length"]) > maximum:
                            raise BodyLimit(policy.max_size_bytes)
                    except ValueError:
                        raise DatasetError(400, "invalid_content_length", "Ukuran request tidak valid.") from None
            consumed = 0

            async def limited_receive():
                nonlocal consumed
                message = await receive()
                if message["type"] == "http.request" and maximum is not None:
                    consumed += len(message.get("body", b""))
                    if consumed > maximum:
                        raise BodyLimit(policy.max_size_bytes)
                return message
            await self.app(scope, limited_receive, send)
        except DatasetError as error:
            await error_response(error)(scope, receive, send)
        except BodyLimit as error:
            await error_response(DatasetError(413, "request_too_large", "Request melebihi policy unggahan.",
                details={"max_size_bytes": error.max_size_bytes}))(scope, receive, send)
        finally:
            if acquired:
                self.slots.release()


def create_app(settings=None, transport=None):
    settings = settings or DatasetSettings()
    gateway = DatasetGateway(settings, transport)
    auth = DatasetAuth(gateway)

    @asynccontextmanager
    async def lifespan(_app):
        yield
        gateway.close()

    application = FastAPI(title="Signify AI - Dataset API", lifespan=lifespan)
    application.state.dataset_gateway = gateway
    application.state.dataset_auth = auth
    application.state.dataset_service = DatasetService(gateway, VideoInspector(settings))
    application.add_middleware(DatasetGate, auth=auth, gateway=gateway,
                               slots=threading.BoundedSemaphore(settings.max_parallel_uploads))
    application.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins,
                               allow_methods=["GET", "POST", "OPTIONS"],
                               allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
                               expose_headers=["Retry-After"])

    @application.exception_handler(DatasetError)
    async def handle_error(_request, error):
        return error_response(error)

    @application.exception_handler(BodyLimit)
    async def body_limit(_request, error):
        return error_response(DatasetError(413, "request_too_large", "Request melebihi policy unggahan.",
            details={"max_size_bytes": error.max_size_bytes}))

    @application.exception_handler(OSError)
    async def resource_error(_request, _error):
        return error_response(DatasetError(503, "local_resource_unavailable", "Resource layanan belum tersedia.", True))

    @application.exception_handler(RequestValidationError)
    async def invalid_request(request, error):
        review = request.url.path.startswith("/api/v1/dataset/reviews/")
        return JSONResponse({"error": {"code": "invalid_review" if review else "invalid_request",
                             "message": "Keputusan, label final, atau alasan penolakan tidak valid." if review else "Request tidak lengkap.", "retryable": False},
                             "fields": [{"loc": list(e["loc"]), "type": e["type"]} for e in error.errors()]}, status_code=422)

    @application.get("/health")
    def health():
        return {"status": "ok", "service": "dataset", "local_only": settings.environment == "local"}

    application.include_router(router)
    return application


app = create_app()
