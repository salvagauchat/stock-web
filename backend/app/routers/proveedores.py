from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import proveedores as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.proveedor import ProveedorCreate, ProveedorOut, ProveedorUpdate

router = APIRouter(prefix="/proveedores", tags=["proveedores"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[ProveedorOut])
async def listar(activos: bool = True, db: AsyncSession = Depends(get_db)):
    return await crud.listar(db, solo_activos=activos)


@router.post("", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
async def crear(datos: ProveedorCreate, db: AsyncSession = Depends(get_db)):
    return await crud.crear(db, datos)


@router.put("/{proveedor_id}", response_model=ProveedorOut)
async def actualizar(proveedor_id: int, datos: ProveedorUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.actualizar(db, proveedor_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")


@router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar(proveedor_id: int, db: AsyncSession = Depends(get_db)):
    try:
        await crud.eliminar(db, proveedor_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
