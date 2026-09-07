from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MovimientoStock(Base):
    __tablename__ = "movimiento_stock"
    __table_args__ = (
        CheckConstraint("tipo IN ('ENTRADA','SALIDA','DEVOLUCION','AJUSTE')", name="ck_movimiento_tipo"),
        CheckConstraint(
            "referencia_tipo IN ('VENTA','DEVOLUCION','COMPRA','AJUSTE_MANUAL') OR referencia_tipo IS NULL",
            name="ck_movimiento_referencia_tipo",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    variante_id: Mapped[int] = mapped_column(
        ForeignKey("variante_producto.id", ondelete="CASCADE"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_anterior: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_nuevo: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    referencia_tipo: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    referencia_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
