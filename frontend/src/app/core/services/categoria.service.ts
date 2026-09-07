import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, CategoriaCreate, CategoriaUpdate } from '../../models/categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  listar(activos = true): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.baseUrl, { params: { activos } });
  }

  crear(datos: CategoriaCreate): Observable<Categoria> {
    return this.http.post<Categoria>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: CategoriaUpdate): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
