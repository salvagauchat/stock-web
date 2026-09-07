from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CategoriaGasto(Base):
    __tablename__ = "categoria_gasto"
    __table_args__ = (CheckConstraint("tipo IN ('CORRIENTE','NO_CORRIENTE')", name="ck_categoria_gasto_tipo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Gasto(Base):
    __tablename__ = "gasto"
    __table_args__ = (
        CheckConstraint("monto > 0", name="ck_gasto_monto"),
        CheckConstraint("medio_pago IN ('EFECTIVO','DEBITO','CREDITO','TRANSFERENCIA')", name="ck_gasto_medio_pago"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    categoria_gasto_id: Mapped[int] = mapped_column(ForeignKey("categoria_gasto.id"), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    medio_pago: Mapped[str] = mapped_column(String(20), nullable=False)
    proveedor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("proveedor.id", ondelete="SET NULL"), nullable=True
    )
    comprobante_numero: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notas: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    categoria: Mapped["CategoriaGasto"] = relationship(lazy="joined")
    proveedor: Mapped[Optional["Proveedor"]] = relationship(lazy="joined")

    @property
    def categoria_nombre(self) -> str:
        return self.categoria.nombre

    @property
    def categoria_tipo(self) -> str:
        return self.categoria.tipo

    @property
    def proveedor_nombre(self) -> Optional[str]:
        return self.proveedor.nombre if self.proveedor else None
