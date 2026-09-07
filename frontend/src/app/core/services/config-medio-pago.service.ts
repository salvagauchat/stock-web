import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigMedioPago } from '../../models/config-medio-pago.model';

@Injectable({ providedIn: 'root' })
export class ConfigMedioPagoService {
  private readonly baseUrl = `${environment.apiUrl}/config-medio-pago`;

  constructor(private http: HttpClient) {}

  listarHabilitados(): Observable<ConfigMedioPago[]> {
    return this.http.get<ConfigMedioPago[]>(this.baseUrl, { params: { habilitados: true } });
  }
}
