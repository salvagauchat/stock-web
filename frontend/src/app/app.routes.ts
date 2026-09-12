import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'stock',
    loadComponent: () => import('./pages/stock/stock.page').then((m) => m.StockPage),
    canActivate: [authGuard],
  },
  {
    path: 'categorias',
    loadComponent: () => import('./pages/categorias/categorias.page').then((m) => m.CategoriasPage),
    canActivate: [authGuard],
  },
  {
    path: 'proveedores',
    loadComponent: () => import('./pages/proveedores/proveedores.page').then((m) => m.ProveedoresPage),
    canActivate: [authGuard],
  },
  {
    path: 'ventas',
    loadComponent: () => import('./pages/ventas/ventas.page').then((m) => m.VentasPage),
    canActivate: [authGuard],
  },
  {
    path: 'historial',
    loadComponent: () => import('./pages/historial/historial.page').then((m) => m.HistorialPage),
    canActivate: [authGuard],
  },
  {
    path: 'gastos',
    loadComponent: () => import('./pages/gastos/gastos.page').then((m) => m.GastosPage),
    canActivate: [authGuard],
  },
  {
    path: 'balance',
    loadComponent: () => import('./pages/balance/balance.page').then((m) => m.BalancePage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
