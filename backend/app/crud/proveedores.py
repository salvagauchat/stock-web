from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.proveedor import Proveedor
from app.schemas.proveedor import ProveedorCreate, ProveedorUpdate


class NoEncontradoError(Exception):
    pass


async def listar(db: AsyncSession, solo_activos: bool = True) -> list[Proveedor]:
    stmt = select(Proveedor).order_by(Proveedor.nombre)
    if solo_activos:
        stmt = stmt.where(Proveedor.activo.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def crear(db: AsyncSession, datos: ProveedorCreate) -> Proveedor:
    proveedor = Proveedor(
        nombre=datos.nombre,
        telefono=datos.telefono,
        email=datos.email,
        direccion=datos.direccion,
        cuit=datos.cuit,
        notas=datos.notas,
    )
    db.add(proveedor)
    await db.commit()
    await db.refresh(proveedor)
    return proveedor


async def actualizar(db: AsyncSession, proveedor_id: int, datos: ProveedorUpdate) -> Proveedor:
    proveedor = await db.get(Proveedor, proveedor_id)
    if proveedor is None:
        raise NoEncontradoError()

    proveedor.nombre = datos.nombre
    proveedor.telefono = datos.telefono
    proveedor.email = datos.email
    proveedor.direccion = datos.direccion
    proveedor.cuit = datos.cuit
    proveedor.notas = datos.notas
    proveedor.activo = datos.activo

    await db.commit()
    await db.refresh(proveedor)
    return proveedor


async def eliminar(db: AsyncSession, proveedor_id: int) -> None:
    proveedor = await db.get(Proveedor, proveedor_id)
    if proveedor is None:
        raise NoEncontradoError()
    proveedor.activo = False
    await db.commit()
