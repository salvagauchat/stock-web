import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoriaGasto, CategoriaGastoCreate, Gasto, GastoCreate, TipoGasto } from '../../models/gasto.model';

@Injectable({ providedIn: 'root' })
export class GastoService {
  private readonly baseUrl = `${environment.apiUrl}/gastos`;
  private readonly baseUrlCategorias = `${environment.apiUrl}/categorias-gasto`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { desde?: string; hasta?: string; tipo?: TipoGasto }): Observable<Gasto[]> {
    const params: Record<string, string> = {};
    if (filtros?.desde) params['desde'] = filtros.desde;
    if (filtros?.hasta) params['hasta'] = filtros.hasta;
    if (filtros?.tipo) params['tipo'] = filtros.tipo;
    return this.http.get<Gasto[]>(this.baseUrl, { params });
  }

  crear(datos: GastoCreate): Observable<Gasto> {
    return this.http.post<Gasto>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: GastoCreate): Observable<Gasto> {
    return this.http.put<Gasto>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarCategorias(): Observable<CategoriaGasto[]> {
    return this.http.get<CategoriaGasto[]>(this.baseUrlCategorias);
  }

  crearCategoria(datos: CategoriaGastoCreate): Observable<CategoriaGasto> {
    return this.http.post<CategoriaGasto>(this.baseUrlCategorias, datos);
  }
}
