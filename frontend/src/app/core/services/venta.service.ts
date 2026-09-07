import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Venta, VentaCreate, VentaDetalle } from '../../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.baseUrl);
  }

  obtener(id: number): Observable<VentaDetalle> {
    return this.http.get<VentaDetalle>(`${this.baseUrl}/${id}`);
  }

  crear(datos: VentaCreate): Observable<VentaDetalle> {
    return this.http.post<VentaDetalle>(this.baseUrl, datos);
  }

  anular(id: number, motivo: string): Observable<VentaDetalle> {
    return this.http.post<VentaDetalle>(`${this.baseUrl}/${id}/anular`, { motivo });
  }
}
