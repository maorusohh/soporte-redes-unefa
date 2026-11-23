"""Primitivas de contraseñas y tokens, independientes de PostgreSQL.

No almacenar contraseñas ni tokens sin hash. Se ejecuta solo en entornos
autorizados. El límite de 12-128 caracteres es una política P0 propuesta.
"""
from __future__ import annotations

import hashlib
import secrets

from pwdlib import PasswordHash
from pwdlib.exceptions import HashVerificationError, UnknownHashError


_password_hash = PasswordHash.recommended()
MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_LENGTH = 128


def hash_password(password: str) -> str:
    if not MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH:
        raise ValueError(
            f"La contraseña debe tener entre {MIN_PASSWORD_LENGTH} y "
            f"{MAX_PASSWORD_LENGTH} caracteres"
        )
    return _password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    """No devolver excepciones de formato de hash a las rutas HTTP."""
    if not password or not stored_hash:
        return False
    try:
        return _password_hash.verify(password, stored_hash)
    except (UnknownHashError, HashVerificationError):
        return False


def new_session_token() -> str:
    """32 bytes criptográficamente aleatorios, codificados en URL-safe."""
    return secrets.token_urlsafe(32)


def new_reset_code() -> str:
    """No persistir ni registrar este valor sin protección."""
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    """SHA-256 suficiente para tokens de alta entropía generados por secrets."""
    if not token:
        raise ValueError("El token no puede estar vacío")
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
