from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import productos as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.producto import (
    AjustarStockRequest,
    ProductoCreate,
    ProductoDetalle,
    ProductoOut,
    ProductoUpdate,
    VarianteCreate,
    VarianteOut,
    VarianteUpdate,
)

router = APIRouter(prefix="/productos", tags=["productos"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[ProductoOut])
async def listar(activos: bool = True, db: AsyncSession = Depends(get_db)):
    return await crud.listar(db, solo_activos=activos)


@router.get("/{producto_id}", response_model=ProductoDetalle)
async def obtener(producto_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.obtener(db, producto_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.post("", response_model=ProductoDetalle, status_code=status.HTTP_201_CREATED)
async def crear(datos: ProductoCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.crear(db, datos)
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.put("/{producto_id}", response_model=ProductoDetalle)
async def actualizar(producto_id: int, datos: ProductoUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.actualizar(db, producto_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar(producto_id: int, db: AsyncSession = Depends(get_db)):
    try:
        await crud.eliminar(db, producto_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.patch("/{producto_id}/variantes/{variante_id}/stock", response_model=VarianteOut)
async def ajustar_stock(
    producto_id: int, variante_id: int, datos: AjustarStockRequest, db: AsyncSession = Depends(get_db)
):
    try:
        return await crud.ajustar_stock(db, producto_id, variante_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante no encontrada")


@router.post("/{producto_id}/variantes", response_model=VarianteOut, status_code=status.HTTP_201_CREATED)
async def crear_variante(producto_id: int, datos: VarianteCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.crear_variante(db, producto_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.put("/{producto_id}/variantes/{variante_id}", response_model=VarianteOut)
async def actualizar_variante(
    producto_id: int, variante_id: int, datos: VarianteUpdate, db: AsyncSession = Depends(get_db)
):
    try:
        return await crud.actualizar_variante(db, producto_id, variante_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante no encontrada")
    except crud.ConflictoError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.mensaje)


@router.delete("/{producto_id}/variantes/{variante_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_variante(producto_id: int, variante_id: int, db: AsyncSession = Depends(get_db)):
    try:
        await crud.eliminar_variante(db, producto_id, variante_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variante no encontrada")
