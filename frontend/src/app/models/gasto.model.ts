import { MedioPago } from './config-medio-pago.model';

export type TipoGasto = 'CORRIENTE' | 'NO_CORRIENTE';

export interface CategoriaGasto {
  id: number;
  nombre: string;
  tipo: TipoGasto;
  descripcion: string | null;
  activo: boolean;
}

export interface CategoriaGastoCreate {
  nombre: string;
  tipo: TipoGasto;
  descripcion?: string;
}

export interface Gasto {
  id: number;
  fecha: string;
  categoria_gasto_id: number;
  descripcion: string;
  monto: string;
  medio_pago: MedioPago;
  proveedor_id: number | null;
  comprobante_numero: string | null;
  notas: string | null;
  creado_en: string;
  categoria_nombre: string;
  categoria_tipo: TipoGasto;
  proveedor_nombre: string | null;
}

export interface GastoCreate {
  categoria_gasto_id: number;
  descripcion: string;
  monto: number;
  medio_pago: MedioPago;
  proveedor_id?: number | null;
  comprobante_numero?: string;
  notas?: string;
}
