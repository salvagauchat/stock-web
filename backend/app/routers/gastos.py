from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import gastos as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.gasto import (
    CategoriaGastoCreate,
    CategoriaGastoOut,
    GastoCreate,
    GastoOut,
    GastoUpdate,
    TipoGastoLiteral,
)

router = APIRouter(prefix="/gastos", tags=["gastos"], dependencies=[Depends(get_current_user)])
router_categorias = APIRouter(
    prefix="/categorias-gasto", tags=["categorias-gasto"], dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=list[GastoOut])
async def listar(
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    tipo: Optional[TipoGastoLiteral] = None,
    categoria_gasto_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    return await crud.listar(db, desde=desde, hasta=hasta, tipo=tipo, categoria_gasto_id=categoria_gasto_id)


@router.post("", response_model=GastoOut, status_code=status.HTTP_201_CREATED)
async def crear(datos: GastoCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.crear(db, datos)
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.put("/{gasto_id}", response_model=GastoOut)
async def actualizar(gasto_id: int, datos: GastoUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.actualizar(db, gasto_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.delete("/{gasto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar(gasto_id: int, db: AsyncSession = Depends(get_db)):
    try:
        await crud.eliminar(db, gasto_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")


@router_categorias.get("", response_model=list[CategoriaGastoOut])
async def listar_categorias(activas: bool = True, db: AsyncSession = Depends(get_db)):
    return await crud.listar_categorias(db, solo_activas=activas)


@router_categorias.post("", response_model=CategoriaGastoOut, status_code=status.HTTP_201_CREATED)
async def crear_categoria(datos: CategoriaGastoCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.crear_categoria(db, datos)
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)
