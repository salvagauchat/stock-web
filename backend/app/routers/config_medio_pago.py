from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import config_medio_pago as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.config_medio_pago import ConfigMedioPagoOut, ConfigMedioPagoUpdate

router = APIRouter(prefix="/config-medio-pago", tags=["config-medio-pago"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[ConfigMedioPagoOut])
async def listar(habilitados: bool = False, db: AsyncSession = Depends(get_db)):
    return await crud.listar(db, solo_habilitados=habilitados)


@router.put("/{medio_pago}", response_model=ConfigMedioPagoOut)
async def actualizar(medio_pago: str, datos: ConfigMedioPagoUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.actualizar(db, medio_pago, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medio de pago no encontrado")
