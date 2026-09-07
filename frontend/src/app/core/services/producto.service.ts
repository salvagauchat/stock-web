import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Producto,
  ProductoCreate,
  ProductoDetalle,
  ProductoUpdate,
  VarianteCreate,
  VarianteProducto,
  VarianteUpdate,
} from '../../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly baseUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  listar(activos = true): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl, { params: { activos } });
  }

  obtener(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalle>(`${this.baseUrl}/${id}`);
  }

  crear(datos: ProductoCreate): Observable<ProductoDetalle> {
    return this.http.post<ProductoDetalle>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: ProductoUpdate): Observable<ProductoDetalle> {
    return this.http.put<ProductoDetalle>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  ajustarStock(
    productoId: number,
    varianteId: number,
    nuevoStock: number,
    motivo?: string,
  ): Observable<VarianteProducto> {
    return this.http.patch<VarianteProducto>(`${this.baseUrl}/${productoId}/variantes/${varianteId}/stock`, {
      nuevo_stock: nuevoStock,
      motivo,
    });
  }

  crearVariante(productoId: number, datos: VarianteCreate): Observable<VarianteProducto> {
    return this.http.post<VarianteProducto>(`${this.baseUrl}/${productoId}/variantes`, datos);
  }

  actualizarVariante(productoId: number, varianteId: number, datos: VarianteUpdate): Observable<VarianteProducto> {
    return this.http.put<VarianteProducto>(`${this.baseUrl}/${productoId}/variantes/${varianteId}`, datos);
  }

  eliminarVariante(productoId: number, varianteId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${productoId}/variantes/${varianteId}`);
  }
}
