export interface Proveedor {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  cuit: string | null;
  notas: string | null;
  activo: boolean;
  creado_en: string;
}

export interface ProveedorCreate {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  cuit?: string;
  notas?: string;
}

export interface ProveedorUpdate extends ProveedorCreate {
  activo: boolean;
}
