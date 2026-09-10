from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class MontosPorMedio(BaseModel):
    EFECTIVO: Decimal
    DEBITO: Decimal
    CREDITO: Decimal
    TRANSFERENCIA: Decimal


class TopCategoria(BaseModel):
    categoria: str
    unidades_vendidas: int
    total_facturado: Decimal


class BalanceDiarioItem(BaseModel):
    fecha: date
    ingresos: Decimal
    egresos: Decimal
    balance: Decimal


class BalanceOut(BaseModel):
    ingresos: Decimal
    cantidad_ventas: int
    gastos_corrientes: Decimal
    gastos_no_corrientes: Decimal
    ganancia_bruta: Decimal
    margen_porcentaje: Decimal
    ingresos_por_medio: MontosPorMedio
    egresos_por_medio: MontosPorMedio
    top_categorias: list[TopCategoria]
    balance_diario: list[BalanceDiarioItem]
