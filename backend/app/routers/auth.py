from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.usuario import Usuario
from app.rate_limit import login_rate_limiter
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioMe
from app.security import crear_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(datos: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = datos.email.lower()

    espera = login_rate_limiter.segundos_restantes_bloqueo(email)
    if espera > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Demasiados intentos fallidos. Probá de nuevo en {espera // 60 + 1} minuto(s).",
            headers={"Retry-After": str(espera)},
        )

    result = await db.execute(select(Usuario).where(Usuario.email == email))
    usuario = result.scalar_one_or_none()

    if usuario is None or not usuario.activo or not verify_password(datos.password, usuario.password_hash):
        login_rate_limiter.registrar_fallo(email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    login_rate_limiter.registrar_exito(email)
    token = crear_access_token(usuario.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UsuarioMe)
async def me(usuario_actual: Usuario = Depends(get_current_user)):
    return usuario_actual
