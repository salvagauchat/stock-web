from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProveedorCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    cuit: Optional[str] = None
    notas: Optional[str] = None


class ProveedorUpdate(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    cuit: Optional[str] = None
    notas: Optional[str] = None
    activo: bool = True


class ProveedorOut(BaseModel):
    id: int
    nombre: str
    telefono: Optional[str]
    email: Optional[str]
    direccion: Optional[str]
    cuit: Optional[str]
    notas: Optional[str]
    activo: bool
    creado_en: datetime

    model_config = {"from_attributes": True}
