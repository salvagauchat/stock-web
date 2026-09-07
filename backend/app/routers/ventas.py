from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import ventas as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.venta import AnularVentaRequest, VentaCreate, VentaDetalle, VentaOut

router = APIRouter(prefix="/ventas", tags=["ventas"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[VentaOut])
async def listar(
    desde: Optional[datetime] = None, hasta: Optional[datetime] = None, db: AsyncSession = Depends(get_db)
):
    return await crud.listar(db, desde=desde, hasta=hasta)


@router.get("/{venta_id}", response_model=VentaDetalle)
async def obtener(venta_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.obtener(db, venta_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")


@router.post("", response_model=VentaDetalle, status_code=status.HTTP_201_CREATED)
async def crear(datos: VentaCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.crear(db, datos)
    except crud.ValidacionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.mensaje)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Una de las variantes no existe")
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.post("/{venta_id}/anular", response_model=VentaDetalle)
async def anular(venta_id: int, datos: AnularVentaRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.anular(db, venta_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)
