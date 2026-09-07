from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None


class CategoriaUpdate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    activo: bool = True


class CategoriaOut(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    icono: Optional[str]
    activo: bool
    creado_en: datetime

    model_config = {"from_attributes": True}
