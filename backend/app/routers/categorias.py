from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import categorias as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.categoria import CategoriaCreate, CategoriaOut, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["categorias"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[CategoriaOut])
async def listar(activos: bool = True, db: AsyncSession = Depends(get_db)):
    return await crud.listar(db, solo_activas=activos)


@router.post("", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
async def crear(datos: CategoriaCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.crear(db, datos)
    except crud.NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una categoría con ese nombre")


@router.put("/{categoria_id}", response_model=CategoriaOut)
async def actualizar(categoria_id: int, datos: CategoriaUpdate, db: AsyncSession = Depends(get_db)):
    try:
        return await crud.actualizar(db, categoria_id, datos)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    except crud.NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una categoría con ese nombre")


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar(categoria_id: int, db: AsyncSession = Depends(get_db)):
    try:
        await crud.eliminar(db, categoria_id)
    except crud.NoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
