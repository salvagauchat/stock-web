from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.venta import ConfigMedioPago
from app.schemas.config_medio_pago import ConfigMedioPagoUpdate


class NoEncontradoError(Exception):
    pass


async def listar(db: AsyncSession, solo_habilitados: bool = False) -> list[ConfigMedioPago]:
    stmt = select(ConfigMedioPago).order_by(ConfigMedioPago.medio_pago)
    if solo_habilitados:
        stmt = stmt.where(ConfigMedioPago.habilitado.is_(True))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def actualizar(db: AsyncSession, medio_pago: str, datos: ConfigMedioPagoUpdate) -> ConfigMedioPago:
    config = await db.get(ConfigMedioPago, medio_pago)
    if config is None:
        raise NoEncontradoError()

    config.descuento_porcentaje = datos.descuento_porcentaje
    config.recargo_porcentaje = datos.recargo_porcentaje
    config.habilitado = datos.habilitado
    config.arancel_banco_porcentaje = datos.arancel_banco_porcentaje

    await db.commit()
    await db.refresh(config)
    return config
