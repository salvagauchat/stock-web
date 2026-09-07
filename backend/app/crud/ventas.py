from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.movimiento_stock import MovimientoStock
from app.models.variante import VarianteProducto
from app.models.venta import DetalleVenta, PagoVenta, Venta
from app.schemas.venta import AnularVentaRequest, VentaCreate

TOLERANCIA = Decimal("0.01")


class NoEncontradoError(Exception):
    pass


class ValidacionError(Exception):
    def __init__(self, mensaje: str):
        self.mensaje = mensaje
        super().__init__(mensaje)


class ConflictoError(Exception):
    def __init__(self, mensaje: str):
        self.mensaje = mensaje
        super().__init__(mensaje)


def _con_relaciones(stmt):
    return stmt.options(
        selectinload(Venta.detalles).selectinload(DetalleVenta.variante).selectinload(VarianteProducto.producto),
        selectinload(Venta.pagos),
    )


async def listar(db: AsyncSession, desde: Optional[datetime] = None, hasta: Optional[datetime] = None) -> list[Venta]:
    stmt = select(Venta).order_by(Venta.fecha.desc())
    if desde is not None:
        stmt = stmt.where(Venta.fecha >= desde)
    if hasta is not None:
        stmt = stmt.where(Venta.fecha <= hasta)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def obtener(db: AsyncSession, venta_id: int) -> Venta:
    stmt = _con_relaciones(select(Venta)).where(Venta.id == venta_id)
    result = await db.execute(stmt)
    venta = result.scalar_one_or_none()
    if venta is None:
        raise NoEncontradoError()
    return venta


async def crear(db: AsyncSession, datos: VentaCreate) -> Venta:
    """Replica venta.service.crear() de la app vieja: valida la matemática
    del pedido, bloquea y valida stock, y recién ahí escribe todo en una
    sola transacción (venta + detalles + movimientos de stock + pagos)."""
    if not datos.items:
        raise ValidacionError("La venta no tiene items")
    if not datos.pagos:
        raise ValidacionError("La venta no tiene pagos")

    subtotal = Decimal("0")
    for item in datos.items:
        subtotal_item = item.precio_unitario * item.cantidad - item.descuento_item
        if subtotal_item < 0:
            raise ValidacionError("El descuento de un item no puede superar su importe")
        subtotal += subtotal_item

    base_aplicable = subtotal - datos.descuento
    if base_aplicable < 0:
        raise ValidacionError("El descuento general no puede superar el subtotal")

    suma_pagos = sum((p.monto_subtotal for p in datos.pagos), Decimal("0"))
    if abs(suma_pagos - base_aplicable) > TOLERANCIA:
        raise ValidacionError(
            f"Los pagos (${suma_pagos:.2f}) no cubren el total a pagar (${base_aplicable:.2f})"
        )

    montos_pago = []
    total = Decimal("0")
    for pago in datos.pagos:
        factor_descuento = 1 - pago.descuento_porcentaje / Decimal("100")
        factor_recargo = 1 + pago.recargo_porcentaje / Decimal("100")
        monto = (pago.monto_subtotal * factor_descuento * factor_recargo).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        montos_pago.append(monto)
        total += monto

    descuento_efectivo = subtotal - total

    # Bloquear las variantes involucradas (ordenadas por id para evitar
    # deadlocks entre ventas concurrentes) y validar stock recién ahí.
    variante_ids = sorted({item.variante_id for item in datos.items})
    result = await db.execute(
        select(VarianteProducto).where(VarianteProducto.id.in_(variante_ids)).with_for_update()
    )
    variantes = {v.id: v for v in result.scalars().all()}

    for item in datos.items:
        variante = variantes.get(item.variante_id)
        if variante is None or not variante.activo:
            raise NoEncontradoError()
        if variante.stock_actual < item.cantidad:
            etiqueta = " / ".join(filter(None, [variante.talle, variante.color])) or f"variante #{variante.id}"
            raise ConflictoError(f"Stock insuficiente para {etiqueta} (disponible: {variante.stock_actual})")

    venta = Venta(
        cliente=datos.cliente,
        notas=datos.notas,
        subtotal=subtotal,
        descuento=descuento_efectivo,
        total=total,
        estado="COMPLETADA",
    )
    db.add(venta)

    try:
        await db.flush()  # asigna venta.id

        for item in datos.items:
            variante = variantes[item.variante_id]
            subtotal_item = item.precio_unitario * item.cantidad - item.descuento_item

            db.add(
                DetalleVenta(
                    venta_id=venta.id,
                    variante_id=item.variante_id,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario,
                    descuento_item=item.descuento_item,
                    subtotal=subtotal_item,
                )
            )

            stock_anterior = variante.stock_actual
            stock_nuevo = stock_anterior - item.cantidad
            db.add(
                MovimientoStock(
                    variante_id=variante.id,
                    tipo="SALIDA",
                    cantidad=item.cantidad,
                    stock_anterior=stock_anterior,
                    stock_nuevo=stock_nuevo,
                    motivo=f"Venta #{venta.id}",
                    referencia_tipo="VENTA",
                    referencia_id=venta.id,
                )
            )
            variante.stock_actual = stock_nuevo

        for pago, monto in zip(datos.pagos, montos_pago):
            db.add(
                PagoVenta(
                    venta_id=venta.id,
                    medio_pago=pago.medio_pago,
                    monto_subtotal=pago.monto_subtotal,
                    descuento_porcentaje=pago.descuento_porcentaje,
                    recargo_porcentaje=pago.recargo_porcentaje,
                    monto=monto,
                    cuotas=pago.cuotas,
                )
            )

        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("No se pudo registrar la venta (datos en conflicto)") from exc

    return await obtener(db, venta.id)


async def anular(db: AsyncSession, venta_id: int, datos: AnularVentaRequest) -> Venta:
    venta = await obtener(db, venta_id)
    if venta.estado == "ANULADA":
        raise ConflictoError("La venta ya está anulada")

    variante_ids = sorted({detalle.variante_id for detalle in venta.detalles})
    result = await db.execute(
        select(VarianteProducto).where(VarianteProducto.id.in_(variante_ids)).with_for_update()
    )
    variantes = {v.id: v for v in result.scalars().all()}

    for detalle in venta.detalles:
        variante = variantes.get(detalle.variante_id)
        if variante is None:
            continue  # la variante fue borrada físicamente (no debería pasar, es RESTRICT)

        stock_anterior = variante.stock_actual
        stock_nuevo = stock_anterior + detalle.cantidad
        db.add(
            MovimientoStock(
                variante_id=variante.id,
                tipo="DEVOLUCION",
                cantidad=detalle.cantidad,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                motivo=f"Anulación venta #{venta.id}: {datos.motivo}",
                referencia_tipo="VENTA",
                referencia_id=venta.id,
            )
        )
        variante.stock_actual = stock_nuevo

    venta.estado = "ANULADA"
    venta.notas = f"{venta.notas or ''}\n[ANULADA] {datos.motivo}".strip()

    await db.commit()
    return await obtener(db, venta.id)
