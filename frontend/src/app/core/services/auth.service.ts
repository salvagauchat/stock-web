import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UsuarioActual {
  id: number;
  email: string;
  nombre: string;
}

const TOKEN_KEY = 'stock_local_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSignal = signal<UsuarioActual | null>(null);
  readonly usuario = this.usuarioSignal.asReadonly();

  private readonly autenticadoSignal = signal<boolean>(!!localStorage.getItem(TOKEN_KEY));
  readonly autenticado = this.autenticadoSignal.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        this.autenticadoSignal.set(true);
      }),
    );
  }

  cargarUsuarioActual(): Observable<UsuarioActual> {
    return this.http
      .get<UsuarioActual>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((usuario) => this.usuarioSignal.set(usuario)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.usuarioSignal.set(null);
    this.autenticadoSignal.set(false);
    this.router.navigateByUrl('/login');
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  estaLogueado(): boolean {
    return !!this.getToken();
  }
}
