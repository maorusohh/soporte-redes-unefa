"""Rutas AUTH-P0 compatibles con docs/10 y el Frontend de Joiber.

El servidor real NO habilita autenticación sin un repositorio de datos.
Los tests pueden inyectar un repositorio falso, sin simular persistencia real.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel

from app.auth.repository import (
    AuthAccount,
    AuthRepository,
    DuplicateEmailError,
)
from app.auth.schemas import (
    ChangePasswordRequest,
    CreateUserRequest,
    ForgotPasswordRequest,
    LoginRequest,
    PublicUser,
    ResetPasswordRequest,
    UserResponse,
    UserRole,
)
from app.auth.security import (
    hash_password,
    new_reset_code,
    new_session_token,
    token_hash,
    verify_password,
)

router = APIRouter(prefix="/api/v1", tags=["authentication"])
COOKIE_NAME = "unefa_session"
SESSION_TTL = timedelta(hours=1)
RESET_TTL = timedelta(minutes=15)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def repository_for_request(request: Request) -> AuthRepository:
    repo = getattr(request.app.state, "auth_repository", None)
    if repo is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Autenticación no disponible: falta configurar PostgreSQL.",
        )
    return repo


def require_same_origin(request: Request) -> None:
    """Protección de origen para operaciones JSON que modifican estado.

    Con cookies SameSite=Strict y sin CORS externo, rechazamos mutaciones
    sin Origin ni Referer fiable. No sustituye autenticación/autorización.
    La configuración HTTPS/proxy será revisada antes de despliegue real.
    """
    target = f"{request.url.scheme}://{request.url.netloc}"
    origin = request.headers.get("origin")
    if origin is not None:
        parsed = urlsplit(origin)
        valid = bool(parsed.scheme and parsed.netloc) and not any(
            (parsed.path, parsed.query, parsed.fragment, parsed.username, parsed.password)
        )
        source = f"{parsed.scheme}://{parsed.netloc}" if valid else ""
    else:
        referer = request.headers.get("referer")
        parsed = urlsplit(referer) if referer else None
        source = (
            f"{parsed.scheme}://{parsed.netloc}"
            if parsed and parsed.scheme and parsed.netloc
            else ""
        )
    if source != target:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Origen de solicitud no autorizado.",
        )


def user_public(account: AuthAccount) -> PublicUser:
    return PublicUser(
        id=account.id, email=account.email,
        role=account.role, active=account.active
    )


def current_account(
    request: Request,
    repo: AuthRepository = Depends(repository_for_request),
) -> AuthAccount:
    session_token = request.cookies.get(COOKIE_NAME)
    if not session_token:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada.")
    session = repo.find_session(token_hash(session_token))
    now = now_utc()
    if (
        session is None
        or session.revoked_at is not None
        or session.expires_at <= now
    ):
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada.")
    account = repo.find_user_by_id(session.user_id)
    if account is None or not account.active or not account.password_hash:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada.")
    return account


def require_admin(
    account: AuthAccount = Depends(current_account),
) -> AuthAccount:
    if account.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Permisos insuficientes.")
    return account


class AdminResetRequest(BaseModel):
    user_id: UUID


@router.post("/auth/login", response_model=UserResponse, dependencies=[Depends(require_same_origin)])
def login(
    payload: LoginRequest, request: Request, response: Response,
    repo: AuthRepository = Depends(repository_for_request),
) -> UserResponse:
    account = repo.find_user_by_email(payload.email)
    if (
        account is None
        or not account.active
        or not account.password_hash
        or not verify_password(payload.password, account.password_hash)
    ):
        # Los detalles de usuario inexistente/inactivo/contraseña incorrecta
        # no se diferencian en la respuesta externa.
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")
    token = new_session_token()
    repo.save_session(token_hash(token), account.id, now_utc() + SESSION_TTL)
    response.set_cookie(
        key=COOKIE_NAME, value=token,
        httponly=True, secure=request.url.scheme == "https",
        samesite="strict", max_age=int(SESSION_TTL.total_seconds()), path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return UserResponse(user=user_public(account))


@router.get("/auth/me", response_model=UserResponse)
def me(account: AuthAccount = Depends(current_account)) -> UserResponse:
    return UserResponse(user=user_public(account))


@router.post("/auth/logout", status_code=204, dependencies=[Depends(require_same_origin)])
def logout(
    request: Request,
    repo: AuthRepository = Depends(repository_for_request),
    _account: AuthAccount = Depends(current_account),
) -> Response:
    repo.revoke_session(token_hash(request.cookies[COOKIE_NAME]), now_utc())
    response = Response(status_code=204)
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="strict")
    response.headers["Cache-Control"] = "no-store"
    return response


@router.post("/auth/change-password", status_code=204, dependencies=[Depends(require_same_origin)])
def change_password(
    payload: ChangePasswordRequest,
    account: AuthAccount = Depends(current_account),
    repo: AuthRepository = Depends(repository_for_request),
) -> Response:
    if not account.password_hash or not verify_password(
        payload.current_password, account.password_hash
    ):
        raise HTTPException(status_code=401, detail="No se pudo cambiar la contraseña.")
    if verify_password(payload.new_password, account.password_hash):
        raise HTTPException(status_code=422, detail="La contraseña nueva debe ser diferente.")
    repo.replace_password_and_revoke_sessions(
        account.id, hash_password(payload.new_password), now_utc()
    )
    response = Response(status_code=204)
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="strict")
    response.headers["Cache-Control"] = "no-store"
    return response


@router.post("/auth/forgot-password", status_code=202, dependencies=[Depends(require_same_origin)])
def forgot_password(
    payload: ForgotPasswordRequest,
    repo: AuthRepository = Depends(repository_for_request),
) -> dict[str, str]:
    account = repo.find_user_by_email(payload.email)
    if account and account.active:
        repo.record_recovery_request(account.id, now_utc())
    return {"detail": "Si corresponde, contacta al administrador autorizado."}


@router.post("/auth/reset-password", status_code=204, dependencies=[Depends(require_same_origin)])
def reset_password(
    payload: ResetPasswordRequest,
    repo: AuthRepository = Depends(repository_for_request),
) -> Response:
    if not repo.consume_reset_and_change_password(
        payload.email, token_hash(payload.code),
        hash_password(payload.new_password), now_utc()
    ):
        raise HTTPException(status_code=400, detail="Código inválido o expirado.")
    response = Response(status_code=204)
    response.headers["Cache-Control"] = "no-store"
    return response


@router.get("/admin/users")
def list_users(
    _admin: AuthAccount = Depends(require_admin),
    repo: AuthRepository = Depends(repository_for_request),
) -> dict:
    return {"users": [user_public(u).model_dump(mode="json") for u in repo.list_users()]}


@router.post("/admin/users", status_code=201, dependencies=[Depends(require_same_origin)])
def create_user(
    payload: CreateUserRequest,
    _admin: AuthAccount = Depends(require_admin),
    repo: AuthRepository = Depends(repository_for_request),
) -> dict:
    try:
        created = repo.create_user(payload.email, payload.role)
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=409, detail="La cuenta ya existe.") from exc
    return {"user": user_public(created).model_dump(mode="json")}


@router.post("/admin/password-resets", status_code=201, dependencies=[Depends(require_same_origin)])
def admin_password_reset(
    payload: AdminResetRequest,
    admin: AuthAccount = Depends(require_admin),
    repo: AuthRepository = Depends(repository_for_request),
) -> dict[str, str]:
    target = repo.find_user_by_id(payload.user_id)
    if target is None or not target.active:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada.")
    code = new_reset_code()
    now = now_utc()
    repo.issue_reset_token(
        target.id, token_hash(code), now + RESET_TTL, admin.id, now
    )
    return {"code": code}
