from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Venta(Base):
    __tablename__ = "venta"
    __table_args__ = (
        CheckConstraint("estado IN ('COMPLETADA','ANULADA','PARCIAL_DEVUELTA')", name="ck_venta_estado"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    cliente: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    descuento: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="COMPLETADA")
    notas: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    detalles: Mapped[list["DetalleVenta"]] = relationship(back_populates="venta", cascade="all, delete-orphan")
    pagos: Mapped[list["PagoVenta"]] = relationship(back_populates="venta", cascade="all, delete-orphan")


class DetalleVenta(Base):
    __tablename__ = "detalle_venta"
    __table_args__ = (CheckConstraint("cantidad > 0", name="ck_detalle_venta_cantidad"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("venta.id", ondelete="CASCADE"), nullable=False)
    variante_id: Mapped[int] = mapped_column(
        ForeignKey("variante_producto.id", ondelete="RESTRICT"), nullable=False
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    descuento_item: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    venta: Mapped["Venta"] = relationship(back_populates="detalles")
    variante: Mapped["VarianteProducto"] = relationship(lazy="joined")

    @property
    def producto_nombre(self) -> str:
        if self.variante and self.variante.producto:
            return self.variante.producto.nombre
        return "Producto eliminado"

    @property
    def variante_talle(self) -> Optional[str]:
        return self.variante.talle if self.variante else None

    @property
    def variante_color(self) -> Optional[str]:
        return self.variante.color if self.variante else None


class PagoVenta(Base):
    __tablename__ = "pago_venta"
    __table_args__ = (
        CheckConstraint(
            "medio_pago IN ('EFECTIVO','DEBITO','CREDITO','TRANSFERENCIA')", name="ck_pago_venta_medio_pago"
        ),
        CheckConstraint("monto > 0", name="ck_pago_venta_monto"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("venta.id", ondelete="CASCADE"), nullable=False)
    medio_pago: Mapped[str] = mapped_column(String(20), nullable=False)
    monto_subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    descuento_porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    recargo_porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    cuotas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    venta: Mapped["Venta"] = relationship(back_populates="pagos")


class ConfigMedioPago(Base):
    __tablename__ = "config_medio_pago"
    __table_args__ = (
        CheckConstraint(
            "medio_pago IN ('EFECTIVO','DEBITO','CREDITO','TRANSFERENCIA')", name="ck_config_medio_pago_medio_pago"
        ),
    )

    medio_pago: Mapped[str] = mapped_column(String(20), primary_key=True)
    descuento_porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    recargo_porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    habilitado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    arancel_banco_porcentaje: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=0)
