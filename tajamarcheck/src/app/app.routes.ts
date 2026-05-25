import { Routes } from '@angular/router';

export const routes: Routes = [
	{ path: 'login', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
	{ path: 'attendance/student', loadComponent: () => import('./attendance/student-attendance/student-attendance.component').then(m => m.StudentAttendanceComponent) },
	{ path: 'attendance/teacher', loadComponent: () => import('./attendance/teacher-attendance/teacher-attendance.component').then(m => m.TeacherAttendanceComponent) },
	{ path: 'home', loadComponent: () => import('./home.component').then(m => m.HomeComponent) },
	{ path: 'fichaje', loadComponent: () => import('./attendance/attendance-check.component').then(m => m.AttendanceCheckComponent) },
	{ path: 'porcentaje', loadComponent: () => import('./attendance/attendance-percentage.component').then(m => m.AttendancePercentageComponent) },
	{ path: 'faltas', loadComponent: () => import('./attendance/attendance-incidents.component').then(m => m.AttendanceIncidentsComponent) },
	{ path: '', redirectTo: 'login', pathMatch: 'full' }
];