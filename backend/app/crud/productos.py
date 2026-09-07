from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.movimiento_stock import MovimientoStock
from app.models.producto import Producto
from app.models.variante import VarianteProducto
from app.schemas.producto import AjustarStockRequest, ProductoCreate, ProductoUpdate, VarianteCreate, VarianteUpdate


class NoEncontradoError(Exception):
    pass


class ConflictoError(Exception):
    def __init__(self, mensaje: str):
        self.mensaje = mensaje
        super().__init__(mensaje)


def _con_relaciones(stmt):
    # Solo trae variantes activas: una eliminada (soft delete) no debe
    # reaparecer en el detalle del producto ni en el gestor de variantes.
    return stmt.options(
        selectinload(Producto.variantes.and_(VarianteProducto.activo.is_(True))),
        selectinload(Producto.categoria),
        selectinload(Producto.proveedor),
    )


async def listar(db: AsyncSession, solo_activos: bool = True) -> list[Producto]:
    stmt = _con_relaciones(select(Producto)).order_by(Producto.nombre)
    if solo_activos:
        stmt = stmt.where(Producto.activo.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().unique().all())


async def obtener(db: AsyncSession, producto_id: int) -> Producto:
    stmt = _con_relaciones(select(Producto)).where(Producto.id == producto_id)
    result = await db.execute(stmt)
    producto = result.scalar_one_or_none()
    if producto is None:
        raise NoEncontradoError()
    return producto


async def crear(db: AsyncSession, datos: ProductoCreate) -> Producto:
    """Crea el producto junto con su variante 'genérica' (sin talle/color) y,
    si trae stock inicial, el movimiento de stock correspondiente. Todo en
    una sola transacción: si algo falla a mitad de camino, no queda un
    producto huérfano sin variante (la debilidad que tenía el sistema viejo)."""
    producto = Producto(
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        marca=datos.marca,
        categoria_id=datos.categoria_id,
        proveedor_id=datos.proveedor_id,
        precio_costo=datos.precio_costo,
        precio_venta=datos.precio_venta,
    )
    db.add(producto)

    try:
        await db.flush()  # asigna producto.id sin cerrar la transacción

        variante = VarianteProducto(
            producto_id=producto.id,
            talle=None,
            color=None,
            stock_actual=datos.stock_inicial,
            stock_minimo=0,
        )
        db.add(variante)
        await db.flush()  # asigna variante.id

        if datos.stock_inicial > 0:
            db.add(
                MovimientoStock(
                    variante_id=variante.id,
                    tipo="ENTRADA",
                    cantidad=datos.stock_inicial,
                    stock_anterior=0,
                    stock_nuevo=datos.stock_inicial,
                    motivo="Carga inicial",
                    referencia_tipo="COMPRA",
                )
            )

        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("Ya existe un producto con esos datos (revisá SKU o código de barras duplicado)") from exc

    return await obtener(db, producto.id)


async def actualizar(db: AsyncSession, producto_id: int, datos: ProductoUpdate) -> Producto:
    producto = await db.get(Producto, producto_id)
    if producto is None:
        raise NoEncontradoError()

    producto.nombre = datos.nombre
    producto.descripcion = datos.descripcion
    producto.marca = datos.marca
    producto.categoria_id = datos.categoria_id
    producto.proveedor_id = datos.proveedor_id
    producto.precio_costo = datos.precio_costo
    producto.precio_venta = datos.precio_venta

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("No se pudo actualizar: datos en conflicto") from exc

    return await obtener(db, producto_id)


async def eliminar(db: AsyncSession, producto_id: int) -> None:
    """Soft delete: desactiva el producto y, en cascada, todas sus variantes.
    Nunca se borra físicamente para preservar el histórico (a futuro, de ventas)."""
    producto = await obtener(db, producto_id)
    producto.activo = False
    for variante in producto.variantes:
        variante.activo = False
    await db.commit()


async def ajustar_stock(
    db: AsyncSession, producto_id: int, variante_id: int, datos: AjustarStockRequest
) -> VarianteProducto:
    """Único camino permitido para cambiar stock_actual: inserta el movimiento
    y actualiza el stock en la misma transacción (commit/rollback atómico)."""
    variante = await db.get(VarianteProducto, variante_id)
    if variante is None or variante.producto_id != producto_id:
        raise NoEncontradoError()

    stock_anterior = variante.stock_actual
    diferencia = datos.nuevo_stock - stock_anterior

    db.add(
        MovimientoStock(
            variante_id=variante.id,
            tipo="AJUSTE",
            cantidad=diferencia,
            stock_anterior=stock_anterior,
            stock_nuevo=datos.nuevo_stock,
            motivo=datos.motivo or "Ajuste manual",
            referencia_tipo="AJUSTE_MANUAL",
        )
    )
    variante.stock_actual = datos.nuevo_stock

    await db.commit()
    await db.refresh(variante)
    return variante


async def crear_variante(db: AsyncSession, producto_id: int, datos: VarianteCreate) -> VarianteProducto:
    """Agrega una variante (talle/color) a un producto ya existente. Si trae
    stock inicial, inserta el movimiento ENTRADA correspondiente, igual que
    al crear el producto con su variante genérica."""
    producto = await db.get(Producto, producto_id)
    if producto is None:
        raise NoEncontradoError()

    variante = VarianteProducto(
        producto_id=producto_id,
        talle=datos.talle,
        color=datos.color,
        sku=datos.sku,
        codigo_barras=datos.codigo_barras,
        stock_actual=datos.stock_inicial,
        stock_minimo=datos.stock_minimo,
    )
    db.add(variante)

    try:
        await db.flush()

        if datos.stock_inicial > 0:
            db.add(
                MovimientoStock(
                    variante_id=variante.id,
                    tipo="ENTRADA",
                    cantidad=datos.stock_inicial,
                    stock_anterior=0,
                    stock_nuevo=datos.stock_inicial,
                    motivo="Carga inicial",
                    referencia_tipo="COMPRA",
                )
            )

        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("Ya existe una variante con ese talle/color o ese SKU/código de barras") from exc

    await db.refresh(variante)
    return variante


async def actualizar_variante(
    db: AsyncSession, producto_id: int, variante_id: int, datos: VarianteUpdate
) -> VarianteProducto:
    """Edita los datos identificatorios de la variante (talle, color, sku,
    código de barras, stock mínimo). Nunca toca stock_actual — eso solo
    puede cambiar vía ajustar_stock()."""
    variante = await db.get(VarianteProducto, variante_id)
    if variante is None or variante.producto_id != producto_id:
        raise NoEncontradoError()

    variante.talle = datos.talle
    variante.color = datos.color
    variante.sku = datos.sku
    variante.codigo_barras = datos.codigo_barras
    variante.stock_minimo = datos.stock_minimo

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictoError("Ya existe una variante con ese talle/color o ese SKU/código de barras") from exc

    await db.refresh(variante)
    return variante


async def eliminar_variante(db: AsyncSession, producto_id: int, variante_id: int) -> None:
    """Soft delete de una variante puntual (no del producto entero)."""
    variante = await db.get(VarianteProducto, variante_id)
    if variante is None or variante.producto_id != producto_id:
        raise NoEncontradoError()
    variante.activo = False
    await db.commit()
