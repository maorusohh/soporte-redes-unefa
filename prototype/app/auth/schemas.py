"""Contratos de datos de autenticación, sin acceso a infraestructura.

La estructura HTTP está propuesta en docs/10-CONTRATO-INTEGRACION-AUTH.md;
los endpoints reales aún no están implementados.
"""
from __future__ import annotations

from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    USER = "USER"


class EmailModel(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalized_email(cls, email: str) -> str:
        return str(email).strip().casefold()


class LoginRequest(EmailModel):
    password: str = Field(min_length=1, max_length=1024)


class ForgotPasswordRequest(EmailModel):
    pass


class ResetPasswordRequest(EmailModel):
    code: str = Field(min_length=16, max_length=256)
    new_password: str = Field(min_length=12, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=12, max_length=128)


class CreateUserRequest(EmailModel):
    role: UserRole = UserRole.USER


class PublicUser(EmailModel):
    id: UUID
    role: UserRole
    active: bool


class UserResponse(BaseModel):
    user: PublicUser
