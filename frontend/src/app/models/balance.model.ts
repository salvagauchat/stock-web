export interface MontosPorMedio {
  EFECTIVO: string;
  DEBITO: string;
  CREDITO: string;
  TRANSFERENCIA: string;
}

export interface TopCategoria {
  categoria: string;
  unidades_vendidas: number;
  total_facturado: string;
}

export interface BalanceDiarioItem {
  fecha: string;
  ingresos: string;
  egresos: string;
  balance: string;
}

export interface Balance {
  ingresos: string;
  gastos_corrientes: string;
  gastos_no_corrientes: string;
  ganancia_bruta: string;
  margen_porcentaje: string;
  ingresos_por_medio: MontosPorMedio;
  egresos_por_medio: MontosPorMedio;
  top_categorias: TopCategoria[];
  balance_diario: BalanceDiarioItem[];
}
