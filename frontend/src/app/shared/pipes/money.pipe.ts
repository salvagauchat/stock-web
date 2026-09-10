import { Pipe, PipeTransform } from '@angular/core';

/* Formato de moneda usado en todo el rediseño Nocturne: "$ 18.900",
   sin decimales, separador de miles es-AR. Ver design_handoff_stocklocal. */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(valor: number | string | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '';
    }
    return '$ ' + Math.round(Number(valor)).toLocaleString('es-AR');
  }
}
