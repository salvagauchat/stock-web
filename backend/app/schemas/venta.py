from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

MedioPagoLiteral = Literal["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"]


class ItemVentaCreate(BaseModel):
    variante_id: int
    cantidad: int = Field(gt=0)
    precio_unitario: Decimal = Field(ge=0)
    descuento_item: Decimal = Field(ge=0, default=Decimal("0"))


class PagoCreate(BaseModel):
    medio_pago: MedioPagoLiteral
    monto_subtotal: Decimal = Field(gt=0)
    descuento_porcentaje: Decimal = Field(ge=0, le=100, default=Decimal("0"))
    recargo_porcentaje: Decimal = Field(ge=0, default=Decimal("0"))
    cuotas: Optional[int] = Field(default=None, ge=1)


class VentaCreate(BaseModel):
    cliente: Optional[str] = None
    notas: Optional[str] = None
    descuento: Decimal = Field(ge=0, default=Decimal("0"))
    items: list[ItemVentaCreate]
    pagos: list[PagoCreate]


class AnularVentaRequest(BaseModel):
    motivo: str = Field(min_length=1)


class PagoOut(BaseModel):
    id: int
    medio_pago: str
    monto_subtotal: Decimal
    descuento_porcentaje: Decimal
    recargo_porcentaje: Decimal
    monto: Decimal
    cuotas: Optional[int]
    fecha: datetime

    model_config = {"from_attributes": True}


class DetalleVentaOut(BaseModel):
    id: int
    variante_id: int
    cantidad: int
    precio_unitario: Decimal
    descuento_item: Decimal
    subtotal: Decimal
    producto_nombre: str
    variante_talle: Optional[str]
    variante_color: Optional[str]

    model_config = {"from_attributes": True}


class VentaOut(BaseModel):
    id: int
    fecha: datetime
    cliente: Optional[str]
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    estado: str
    notas: Optional[str]
    creado_en: datetime

    model_config = {"from_attributes": True}


class VentaDetalle(VentaOut):
    detalles: list[DetalleVentaOut] = []
    pagos: list[PagoOut] = []
