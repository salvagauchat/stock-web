from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

TipoGastoLiteral = Literal["CORRIENTE", "NO_CORRIENTE"]
MedioPagoLiteral = Literal["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"]


class CategoriaGastoCreate(BaseModel):
    nombre: str
    tipo: TipoGastoLiteral
    descripcion: Optional[str] = None


class CategoriaGastoUpdate(BaseModel):
    nombre: str
    tipo: TipoGastoLiteral
    descripcion: Optional[str] = None
    activo: bool = True


class CategoriaGastoOut(BaseModel):
    id: int
    nombre: str
    tipo: TipoGastoLiteral
    descripcion: Optional[str]
    activo: bool

    model_config = {"from_attributes": True}


class GastoCreate(BaseModel):
    fecha: Optional[datetime] = None
    categoria_gasto_id: int
    descripcion: str
    monto: Decimal = Field(gt=0)
    medio_pago: MedioPagoLiteral
    proveedor_id: Optional[int] = None
    comprobante_numero: Optional[str] = None
    notas: Optional[str] = None


class GastoUpdate(GastoCreate):
    pass


class GastoOut(BaseModel):
    id: int
    fecha: datetime
    categoria_gasto_id: int
    descripcion: str
    monto: Decimal
    medio_pago: str
    proveedor_id: Optional[int]
    comprobante_numero: Optional[str]
    notas: Optional[str]
    creado_en: datetime
    categoria_nombre: str
    categoria_tipo: str
    proveedor_nombre: Optional[str]

    model_config = {"from_attributes": True}
