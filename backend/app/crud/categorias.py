from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate


class NombreDuplicadoError(Exception):
    pass


class NoEncontradoError(Exception):
    pass


async def listar(db: AsyncSession, solo_activas: bool = True) -> list[Categoria]:
    stmt = select(Categoria).order_by(Categoria.nombre)
    if solo_activas:
        stmt = stmt.where(Categoria.activo.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def crear(db: AsyncSession, datos: CategoriaCreate) -> Categoria:
    categoria = Categoria(nombre=datos.nombre, descripcion=datos.descripcion, icono=datos.icono)
    db.add(categoria)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise NombreDuplicadoError() from exc
    await db.refresh(categoria)
    return categoria


async def actualizar(db: AsyncSession, categoria_id: int, datos: CategoriaUpdate) -> Categoria:
    categoria = await db.get(Categoria, categoria_id)
    if categoria is None:
        raise NoEncontradoError()

    categoria.nombre = datos.nombre
    categoria.descripcion = datos.descripcion
    categoria.icono = datos.icono
    categoria.activo = datos.activo

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise NombreDuplicadoError() from exc
    await db.refresh(categoria)
    return categoria


async def eliminar(db: AsyncSession, categoria_id: int) -> None:
    categoria = await db.get(Categoria, categoria_id)
    if categoria is None:
        raise NoEncontradoError()
    categoria.activo = False
    await db.commit()
