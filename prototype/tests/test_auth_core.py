"""Primeras pruebas de dominio AUTH-001: no prueban endpoints ni BD."""
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.auth.schemas import (
    ChangePasswordRequest,
    CreateUserRequest,
    LoginRequest,
    PublicUser,
    ResetPasswordRequest,
    UserRole,
)
from app.auth.security import (
    hash_password,
    new_reset_code,
    new_session_token,
    token_hash,
    verify_password,
)


def test_password_argon2_hash_and_verification():
    password = "clave-de-laboratorio-2026"
    stored = hash_password(password)
    assert stored != password
    assert stored.startswith("$argon2")
    assert verify_password(password, stored)
    assert not verify_password("contraseña-equivocada", stored)


def test_reject_password_outside_allowed_length():
    with pytest.raises(ValueError):
        hash_password("corta")
    with pytest.raises(ValueError):
        hash_password("A" * 129)
    with pytest.raises(ValidationError):
        ChangePasswordRequest(current_password="anterior", new_password="corta")


def test_tokens_unique_and_hashes_are_not_raw_values():
    first, second = new_session_token(), new_session_token()
    reset = new_reset_code()
    assert first != second
    assert first != reset
    assert len(first) >= 32
    assert token_hash(first) != first
    assert token_hash(first) == token_hash(first)
    assert token_hash(first) != token_hash(second)


def test_malformed_hash_rejected_without_crashing():
    assert not verify_password("cualquier-clave", "hash-invalido")
    assert not verify_password("", "hash-invalido")


def test_email_is_normalized_and_invalid_email_rejected():
    request = LoginRequest(email="ADMIN@example.com", password="clave-laboratorio")
    assert request.email == "admin@example.com"
    with pytest.raises(ValidationError):
        LoginRequest(email="invalido", password="clave-laboratorio")


def test_roles_public_data_and_reset_contract():
    public = PublicUser(
        id=uuid4(), email="USER@example.com", role=UserRole.USER, active=True
    )
    assert public.email == "user@example.com"
    assert CreateUserRequest(email="user@example.com").role == UserRole.USER
    with pytest.raises(ValidationError):
        PublicUser(id=uuid4(), email="user@example.com", role="SUPERADMIN", active=True)
    with pytest.raises(ValidationError):
        ResetPasswordRequest(
            email="user@example.com", code="123", new_password="nueva-clave-segura"
        )
