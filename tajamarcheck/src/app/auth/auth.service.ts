import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  saveSession(token: string, username: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    
    // Role detection rule: if username contains 'profe' or 'admin' -> profesor, else -> alumno
    const isTeacher = username.toLowerCase().includes('profe') || username.toLowerCase().includes('admin');
    const role = isTeacher ? 'profesor' : 'alumno';
    localStorage.setItem('role', role);
    console.log(`AuthService: Sesión guardada. Usuario: ${username}, Rol asignado: ${role}`);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token') && !!localStorage.getItem('username');
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getRole(): 'alumno' | 'profesor' {
    return (localStorage.getItem('role') as 'alumno' | 'profesor') || 'alumno';
  }

  getStudentId(): number {
    const username = this.getUsername();
    // Extraer cualquier número del correo o nombre de usuario
    const match = username.match(/\d+/);
    const parsedId = match ? parseInt(match[0], 10) : 101; // ID por defecto si no hay números
    
    // Si el usuario es alumno y el email es alumno12@tajamar.com, su studentId es 12
    return parsedId;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    console.log('AuthService: Sesión eliminada.');
  }
}
