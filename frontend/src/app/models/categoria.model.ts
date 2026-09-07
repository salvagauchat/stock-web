export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  activo: boolean;
  creado_en: string;
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string;
  icono?: string;
}

export interface CategoriaUpdate {
  nombre: string;
  descripcion?: string;
  icono?: string;
  activo: boolean;
}
