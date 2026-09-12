import { Component, OnInit, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IonApp, IonRouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly urlActual = signal('');
  sidebarAbierto = signal(false);

  readonly stockActivo = computed(() =>
    ['/stock', '/categorias', '/proveedores'].some((p) => this.urlActual().startsWith(p)),
  );

  readonly iniciales = computed(() => {
    const nombre = this.auth.usuario()?.nombre?.trim();
    if (!nombre) {
      return '';
    }
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('');
  });

  constructor(
    public auth: AuthService,
    private router: Router,
  ) {
    this.urlActual.set(this.router.url);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.urlActual.set((e as NavigationEnd).urlAfterRedirects);
      this.sidebarAbierto.set(false);
    });
  }

  ngOnInit() {
    if (this.auth.autenticado()) {
      this.auth.cargarUsuarioActual().subscribe();
    }
  }

  toggleSidebar() {
    this.sidebarAbierto.update((v) => !v);
  }

  cerrarSidebar() {
    this.sidebarAbierto.set(false);
  }

  logout() {
    this.auth.logout();
  }
}
