import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Balance } from '../../models/balance.model';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly baseUrl = `${environment.apiUrl}/balance`;

  constructor(private http: HttpClient) {}

  obtener(desde: string, hasta: string): Observable<Balance> {
    return this.http.get<Balance>(this.baseUrl, { params: { desde, hasta } });
  }
}
