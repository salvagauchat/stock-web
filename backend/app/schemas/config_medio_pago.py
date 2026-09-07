from decimal import Decimal

from pydantic import BaseModel, Field


class ConfigMedioPagoOut(BaseModel):
    medio_pago: str
    descuento_porcentaje: Decimal
    recargo_porcentaje: Decimal
    habilitado: bool
    arancel_banco_porcentaje: Decimal

    model_config = {"from_attributes": True}


class ConfigMedioPagoUpdate(BaseModel):
    descuento_porcentaje: Decimal = Field(ge=0, le=100)
    recargo_porcentaje: Decimal = Field(ge=0)
    habilitado: bool
    arancel_banco_porcentaje: Decimal = Field(ge=0, le=100)
