/* Utilidades de presentación compartidas por las pantallas de catálogo
   (Ventas, Stock, ...). Ver design_handoff_stocklocal/README.md. */

/* Colores de miniatura por categoría, en el mismo espíritu del mock
   (que usa un mapa fijo de 8 categorías): como acá las categorías las
   crea el usuario, se elige un color de esta paleta según el id. */
const PALETA_CATEGORIA = ['#3a3f63', '#33415a', '#4a3a52', '#3b3a52', '#3f4a4a', '#523a45', '#45385a', '#4d452f'];
const COLOR_SIN_CATEGORIA = '#2c2f3d';

export function colorCategoria(categoriaId: number | null): string {
  if (categoriaId === null) {
    return COLOR_SIN_CATEGORIA;
  }
  return PALETA_CATEGORIA[categoriaId % PALETA_CATEGORIA.length];
}

export function inicial(nombre: string): string {
  return nombre.charAt(0).toUpperCase();
}

export function etiquetaVariante(v: { talle: string | null; color: string | null }): string {
  if (!v.talle && !v.color) {
    return 'General';
  }
  return [v.talle, v.color].filter(Boolean).join(' / ');
}

/* Swatches de color para variantes talle/color — mismo mapa que trae el
   mock (design_handoff_stocklocal). Colores en español, tal como se
   cargan hoy en el campo "color" de la variante. */
const SWATCH_POR_COLOR: Record<string, string> = {
  Negro: '#2a2b33',
  Blanco: '#e4e7f5',
  Gris: '#9397ab',
  Azul: '#3d5480',
  Celeste: '#7d9fd0',
  Verde: '#4d6a52',
  Beige: '#c9b795',
  Suela: '#8a6a44',
  Estampado: '#8f6f8f',
  Surtido: '#75798c',
};
const SWATCH_DEFECTO = '#595d6c';

export function swatchColor(color: string | null): string {
  if (!color) {
    return SWATCH_DEFECTO;
  }
  return SWATCH_POR_COLOR[color] ?? SWATCH_DEFECTO;
}
