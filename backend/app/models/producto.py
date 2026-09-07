from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Producto(Base):
    __tablename__ = "producto"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    marca: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    categoria_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categoria.id", ondelete="SET NULL"), nullable=True
    )
    proveedor_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("proveedor.id", ondelete="SET NULL"), nullable=True
    )
    precio_costo: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    precio_venta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    categoria: Mapped[Optional["Categoria"]] = relationship(lazy="joined")
    proveedor: Mapped[Optional["Proveedor"]] = relationship(lazy="joined")
    variantes: Mapped[list["VarianteProducto"]] = relationship(
        back_populates="producto", cascade="all, delete-orphan"
    )

    @property
    def categoria_nombre(self) -> Optional[str]:
        return self.categoria.nombre if self.categoria else None

    @property
    def proveedor_nombre(self) -> Optional[str]:
        return self.proveedor.nombre if self.proveedor else None

    @property
    def stock_total(self) -> int:
        return sum(v.stock_actual for v in self.variantes if v.activo)
