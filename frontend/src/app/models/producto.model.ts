export interface VarianteProducto {
  id: number;
  producto_id: number;
  talle: string | null;
  color: string | null;
  sku: string | null;
  codigo_barras: string | null;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  categoria_id: number | null;
  proveedor_id: number | null;
  // El backend serializa los Decimal como string para no perder precisión.
  precio_costo: string;
  precio_venta: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  categoria_nombre: string | null;
  proveedor_nombre: string | null;
  stock_total: number;
}

export interface ProductoDetalle extends Producto {
  variantes: VarianteProducto[];
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  marca?: string;
  categoria_id: number | null;
  proveedor_id: number | null;
  precio_costo: number;
  precio_venta: number;
  stock_inicial: number;
}

export interface ProductoUpdate {
  nombre: string;
  descripcion?: string;
  marca?: string;
  categoria_id: number | null;
  proveedor_id: number | null;
  precio_costo: number;
  precio_venta: number;
}

export interface VarianteCreate {
  talle?: string;
  color?: string;
  sku?: string;
  codigo_barras?: string;
  stock_minimo: number;
  stock_inicial: number;
}

export interface VarianteUpdate {
  talle?: string;
  color?: string;
  sku?: string;
  codigo_barras?: string;
  stock_minimo: number;
}
