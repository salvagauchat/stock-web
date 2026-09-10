from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.gasto import CategoriaGasto, Gasto
from app.schemas.gasto import CategoriaGastoCreate, CategoriaGastoUpdate, GastoCreate, GastoUpdate


class NoEncontradoError(Exception):
    pass


class ConflictoError(Exception):
    def __init__(self, mensaje: str):
        self.mensaje = mensaje
        super().__init__(mensaje)


def _con_relaciones(stmt):
    return stmt.options(selectinload(Gasto.categoria), selectinload(Gasto.proveedor))


async def listar(
    db: AsyncSession,
    desde: Optional[datetime] = None,
    hasta: Optional[datetime] = None,
    tipo: Optional[str] = None,
    categoria_gasto_id: Optional[int] = None,
) -> list[Gasto]:
    stmt = _con_relaciones(select(Gasto)).order_by(Gasto.fecha.desc())
    if desde is not None:
        stmt = stmt.where(Gasto.fecha >= desde)
    if hasta is not None:
        stmt = stmt.where(Gasto.fecha <= hasta)
    if categoria_gasto_id is not None:
        stmt = stmt.where(Gasto.categoria_gasto_id == categoria_gasto_id)
    if tipo is not None:
        stmt = stmt.join(Gasto.categoria).where(CategoriaGasto.tipo == tipo)
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def obtener(db: AsyncSession, gasto_id: int) -> Gasto:
    stmt = _con_relaciones(select(Gasto)).where(Gasto.id == gasto_id)
    result = await db.execute(stmt)
    gasto = result.scalar_one_or_none()
    if gasto is None:
        raise NoEncontradoError()
    return gasto


async def crear(db: AsyncSession, datos: GastoCreate) -> Gasto:
    gasto = Gasto(
        fecha=datos.fecha or datetime.now(timezone.utc),
        categoria_gasto_id=datos.categoria_gasto_id,
        descripcion=datos.descripcion,
        monto=datos.monto,
        medio_pago=datos.medio_pago,
        proveedor_id=datos.proveedor_id,
        comprobante_numero=datos.comprobante_numero,
        notas=datos.notas,
    )
    db.add(gasto)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("No se pudo registrar el gasto (categoría o proveedor inválido)") from exc
    return await obtener(db, gasto.id)


async def actualizar(db: AsyncSession, gasto_id: int, datos: GastoUpdate) -> Gasto:
    gasto = await db.get(Gasto, gasto_id)
    if gasto is None:
        raise NoEncontradoError()

    if datos.fecha:
        gasto.fecha = datos.fecha
    gasto.categoria_gasto_id = datos.categoria_gasto_id
    gasto.descripcion = datos.descripcion
    gasto.monto = datos.monto
    gasto.medio_pago = datos.medio_pago
    gasto.proveedor_id = datos.proveedor_id
    gasto.comprobante_numero = datos.comprobante_numero
    gasto.notas = datos.notas

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("No se pudo actualizar el gasto (categoría o proveedor inválido)") from exc
    return await obtener(db, gasto_id)


async def eliminar(db: AsyncSession, gasto_id: int) -> None:
    """A diferencia del resto de las entidades, gasto se borra físicamente
    (igual que la app vieja) — no hay histórico de ventas ni stock que
    dependa de un gasto ya cargado."""
    gasto = await db.get(Gasto, gasto_id)
    if gasto is None:
        raise NoEncontradoError()
    await db.delete(gasto)
    await db.commit()


async def listar_categorias(db: AsyncSession, solo_activas: bool = True) -> list[CategoriaGasto]:
    stmt = select(CategoriaGasto).order_by(CategoriaGasto.tipo, CategoriaGasto.nombre)
    if solo_activas:
        stmt = stmt.where(CategoriaGasto.activo.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def crear_categoria(db: AsyncSession, datos: CategoriaGastoCreate) -> CategoriaGasto:
    categoria = CategoriaGasto(nombre=datos.nombre, tipo=datos.tipo, descripcion=datos.descripcion)
    db.add(categoria)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("Ya existe una categoría de gasto con ese nombre") from exc
    await db.refresh(categoria)
    return categoria


async def actualizar_categoria(db: AsyncSession, categoria_id: int, datos: CategoriaGastoUpdate) -> CategoriaGasto:
    categoria = await db.get(CategoriaGasto, categoria_id)
    if categoria is None:
        raise NoEncontradoError()

    categoria.nombre = datos.nombre
    categoria.tipo = datos.tipo
    categoria.descripcion = datos.descripcion
    categoria.activo = datos.activo

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("Ya existe una categoría de gasto con ese nombre") from exc
    await db.refresh(categoria)
    return categoria


async def eliminar_categoria(db: AsyncSession, categoria_id: int) -> None:
    categoria = await db.get(CategoriaGasto, categoria_id)
    if categoria is None:
        raise NoEncontradoError()
    categoria.activo = False
    await db.commit()
