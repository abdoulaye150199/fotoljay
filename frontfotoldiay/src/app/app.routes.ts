import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.Home)
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products-module').then(m => m.ProductsModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/admin/admin-module').then(m => m.AdminModule),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
