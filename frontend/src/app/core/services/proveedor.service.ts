import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor, ProveedorCreate, ProveedorUpdate } from '../../models/proveedor.model';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly baseUrl = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  listar(activos = true): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.baseUrl, { params: { activos } });
  }

  crear(datos: ProveedorCreate): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: ProveedorUpdate): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
