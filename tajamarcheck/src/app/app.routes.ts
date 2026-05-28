import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'fichar', loadComponent: () => import('./student-checkin/student-checkin.component').then(m => m.StudentCheckinComponent) },
  { path: 'perfil', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];