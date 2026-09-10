from collections import defaultdict
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gasto import CategoriaGasto, Gasto
from app.models.producto import Producto
from app.models.variante import VarianteProducto
from app.models.venta import DetalleVenta, PagoVenta, Venta

MEDIOS_PAGO = ["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"]


async def obtener_balance(db: AsyncSession, desde: datetime, hasta: datetime) -> dict:
    """Todo lo que necesita el dashboard de Balance, calculado en una sola
    pasada (a diferencia de la app vieja, que hacía una consulta por día para
    los cobros por medio de pago — acá se resuelve con una sola query)."""

    result = await db.execute(
        select(Venta).where(Venta.fecha >= desde, Venta.fecha <= hasta, Venta.estado != "ANULADA")
    )
    ventas = list(result.scalars().all())
    ingresos = sum((v.total for v in ventas), Decimal("0"))
    venta_ids = [v.id for v in ventas]

    result = await db.execute(
        select(Gasto.monto, Gasto.fecha, Gasto.medio_pago, CategoriaGasto.tipo)
        .join(CategoriaGasto, Gasto.categoria_gasto_id == CategoriaGasto.id)
        .where(Gasto.fecha >= desde, Gasto.fecha <= hasta)
    )
    filas_gasto = result.all()
    gastos_corrientes = sum((monto for monto, _f, _mp, tipo in filas_gasto if tipo == "CORRIENTE"), Decimal("0"))
    gastos_no_corrientes = sum((monto for monto, _f, _mp, tipo in filas_gasto if tipo == "NO_CORRIENTE"), Decimal("0"))

    ingresos_por_medio = {medio: Decimal("0") for medio in MEDIOS_PAGO}
    if venta_ids:
        result = await db.execute(select(PagoVenta).where(PagoVenta.venta_id.in_(venta_ids)))
        for pago in result.scalars().all():
            ingresos_por_medio[pago.medio_pago] += pago.monto

    egresos_por_medio = {medio: Decimal("0") for medio in MEDIOS_PAGO}
    for monto, _f, medio_pago, _tipo in filas_gasto:
        egresos_por_medio[medio_pago] += monto

    # Ganancia bruta y top de categorías más vendidas (por unidades), no por producto.
    costo_total = Decimal("0")
    ventas_por_categoria: dict[str, dict] = {}
    if venta_ids:
        result = await db.execute(
            select(DetalleVenta, Producto)
            .join(VarianteProducto, DetalleVenta.variante_id == VarianteProducto.id)
            .join(Producto, VarianteProducto.producto_id == Producto.id)
            .where(DetalleVenta.venta_id.in_(venta_ids))
        )
        for detalle, producto in result.all():
            costo_total += producto.precio_costo * detalle.cantidad
            nombre_categoria = producto.categoria_nombre or "Sin categoría"
            entry = ventas_por_categoria.setdefault(
                nombre_categoria, {"unidades_vendidas": 0, "total_facturado": Decimal("0")}
            )
            entry["unidades_vendidas"] += detalle.cantidad
            entry["total_facturado"] += detalle.subtotal

    ganancia_bruta = ingresos - costo_total
    margen_porcentaje = (
        (ganancia_bruta / ingresos * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if ingresos > 0
        else Decimal("0")
    )

    top_categorias = sorted(
        ({"categoria": nombre, **datos} for nombre, datos in ventas_por_categoria.items()),
        key=lambda x: x["unidades_vendidas"],
        reverse=True,
    )[:5]

    ingresos_por_dia: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for v in ventas:
        ingresos_por_dia[v.fecha.date()] += v.total

    egresos_por_dia: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for monto, fecha, _mp, _tipo in filas_gasto:
        egresos_por_dia[fecha.date()] += monto

    dias = sorted(set(ingresos_por_dia) | set(egresos_por_dia))
    balance_diario = [
        {
            "fecha": dia,
            "ingresos": ingresos_por_dia.get(dia, Decimal("0")),
            "egresos": egresos_por_dia.get(dia, Decimal("0")),
            "balance": ingresos_por_dia.get(dia, Decimal("0")) - egresos_por_dia.get(dia, Decimal("0")),
        }
        for dia in dias
    ]

    return {
        "ingresos": ingresos,
        "cantidad_ventas": len(ventas),
        "gastos_corrientes": gastos_corrientes,
        "gastos_no_corrientes": gastos_no_corrientes,
        "ganancia_bruta": ganancia_bruta,
        "margen_porcentaje": margen_porcentaje,
        "ingresos_por_medio": ingresos_por_medio,
        "egresos_por_medio": egresos_por_medio,
        "top_categorias": top_categorias,
        "balance_diario": balance_diario,
    }
