import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthState {
  isLoggedIn: boolean;
  username: string;
  email: string;
  role: 'alumno' | 'profesor';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject: BehaviorSubject<AuthState>;
  public authState$: Observable<AuthState>;

  constructor() {
    const initial: AuthState = {
      isLoggedIn: this.isLoggedIn(),
      username: this.getUsername(),
      email: this.getEmail(),
      role: this.getRole()
    };
    this.authStateSubject = new BehaviorSubject<AuthState>(initial);
    this.authState$ = this.authStateSubject.asObservable();
  }
  saveSession(token: string, username: string, email?: string, roleFromApi?: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    if (email) {
      localStorage.setItem('email', email);
    } else if (username && username.includes('@')) {
      // If username looks like an email, store it as email too
      localStorage.setItem('email', username);
    }

    // Determine role: prefer explicit role from API, otherwise fallback to username/email detection
    let role: 'alumno' | 'profesor';
    if (roleFromApi) {
      const probeApi = roleFromApi.toLowerCase();
      role = probeApi.includes('prof') || probeApi.includes('admin') ? 'profesor' : 'alumno';
    } else {
      const probe = (email || username || '').toLowerCase();
      const isTeacher = probe.includes('profe') || probe.includes('admin');
      role = isTeacher ? 'profesor' : 'alumno';
    }
    localStorage.setItem('role', role);
    console.log(`AuthService: Sesión guardada. Usuario: ${username}, Email: ${localStorage.getItem('email')}, Rol asignado: ${role}`);

    // Emit updated auth state
    this.authStateSubject.next({
      isLoggedIn: true,
      username: username,
      email: localStorage.getItem('email') || '',
      role: role
    });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token') && !!localStorage.getItem('username');
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getEmail(): string {
    return localStorage.getItem('email') || '';
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
    localStorage.removeItem('email');
    console.log('AuthService: Sesión eliminada.');

    // Emit logged out state
    this.authStateSubject.next({
      isLoggedIn: false,
      username: '',
      email: '',
      role: 'alumno'
    });
  }
}
