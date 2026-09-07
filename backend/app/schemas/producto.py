from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    categoria_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    precio_costo: Decimal = Field(ge=0, default=Decimal("0"))
    precio_venta: Decimal = Field(ge=0, default=Decimal("0"))
    stock_inicial: int = Field(ge=0, default=0)


class ProductoUpdate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    marca: Optional[str] = None
    categoria_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    precio_costo: Decimal = Field(ge=0)
    precio_venta: Decimal = Field(ge=0)


class VarianteCreate(BaseModel):
    talle: Optional[str] = None
    color: Optional[str] = None
    sku: Optional[str] = None
    codigo_barras: Optional[str] = None
    stock_minimo: int = Field(ge=0, default=0)
    stock_inicial: int = Field(ge=0, default=0)


class VarianteUpdate(BaseModel):
    talle: Optional[str] = None
    color: Optional[str] = None
    sku: Optional[str] = None
    codigo_barras: Optional[str] = None
    stock_minimo: int = Field(ge=0)


class VarianteOut(BaseModel):
    id: int
    producto_id: int
    talle: Optional[str]
    color: Optional[str]
    sku: Optional[str]
    codigo_barras: Optional[str]
    stock_actual: int
    stock_minimo: int
    activo: bool

    model_config = {"from_attributes": True}


class ProductoOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    marca: Optional[str]
    categoria_id: Optional[int]
    proveedor_id: Optional[int]
    precio_costo: Decimal
    precio_venta: Decimal
    activo: bool
    creado_en: datetime
    actualizado_en: datetime
    categoria_nombre: Optional[str] = None
    proveedor_nombre: Optional[str] = None
    stock_total: int = 0

    model_config = {"from_attributes": True}


class ProductoDetalle(ProductoOut):
    variantes: list[VarianteOut] = []


class AjustarStockRequest(BaseModel):
    nuevo_stock: int = Field(ge=0)
    motivo: Optional[str] = None
