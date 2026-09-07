import { MedioPago } from './config-medio-pago.model';

export interface ItemVentaCreate {
  variante_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento_item?: number;
}

export interface PagoCreate {
  medio_pago: MedioPago;
  monto_subtotal: number;
  descuento_porcentaje?: number;
  recargo_porcentaje?: number;
  cuotas?: number;
}

export interface VentaCreate {
  cliente?: string;
  notas?: string;
  items: ItemVentaCreate[];
  pagos: PagoCreate[];
}

export interface PagoVenta {
  id: number;
  medio_pago: MedioPago;
  monto_subtotal: string;
  descuento_porcentaje: string;
  recargo_porcentaje: string;
  monto: string;
  cuotas: number | null;
  fecha: string;
}

export interface DetalleVenta {
  id: number;
  variante_id: number;
  cantidad: number;
  precio_unitario: string;
  descuento_item: string;
  subtotal: string;
  producto_nombre: string;
  variante_talle: string | null;
  variante_color: string | null;
}

export type EstadoVenta = 'COMPLETADA' | 'ANULADA' | 'PARCIAL_DEVUELTA';

export interface Venta {
  id: number;
  fecha: string;
  cliente: string | null;
  subtotal: string;
  descuento: string;
  total: string;
  estado: EstadoVenta;
  notas: string | null;
  creado_en: string;
}

export interface VentaDetalle extends Venta {
  detalles: DetalleVenta[];
  pagos: PagoVenta[];
}
