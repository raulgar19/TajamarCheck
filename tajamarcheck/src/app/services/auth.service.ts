import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthState {
  isLoggedIn: boolean;
  username: string;
  email: string;
  courseId: number;
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
      courseId: this.getCourseId(),
      role: this.getRole()
    };

    this.authStateSubject = new BehaviorSubject<AuthState>(initial);
    this.authState$ = this.authStateSubject.asObservable();
  }

  saveSession(token: string, username: string, email?: string, roleFromApi?: string, courseId?: number) {
    localStorage.setItem('token', token);

    const resolvedEmail = email || (username && username.includes('@') ? username : '');
    if (resolvedEmail) {
      localStorage.setItem('email', resolvedEmail);
    }

    if (typeof courseId === 'number' && courseId > 0) {
      localStorage.setItem('courseId', String(courseId));
    }

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
    console.log(`AuthService: Sesión guardada. Email: ${localStorage.getItem('email')}, Rol asignado: ${role}, Curso: ${this.getCourseId()}`);

    this.emitAuthState();
  }

  saveExternalProfileData(profile: any) {
    if (!profile) {
      console.warn('AuthService: saveExternalProfileData llamado sin perfil.');
      return;
    }

    const email = profile.email || profile.mail || profile.userEmail || profile.usuario?.email;
    const roleRaw = profile.role || profile.roleName || profile.usuario?.role || profile.usuario?.roleName;
    const idRoleRaw = profile.idRole ?? profile.idrole ?? profile.usuario?.idRole ?? profile.usuario?.idrole;
    const courseIdRaw = profile.idCurso ?? profile.courseId ?? profile.cursoId ?? profile.usuario?.idCurso ?? profile.usuario?.courseId ?? profile.usuario?.cursoId;

    console.log('AuthService: Perfil externo recibido para cachear:', profile);
    console.log('AuthService: Perfil externo candidatos -> email:', email, 'roleRaw:', roleRaw, 'idRoleRaw:', idRoleRaw, 'courseIdRaw:', courseIdRaw);

    if (email) {
      localStorage.setItem('email', email);
    }

    const parsedCourseId = Number(courseIdRaw);
    if (!Number.isNaN(parsedCourseId) && parsedCourseId > 0) {
      localStorage.setItem('courseId', String(parsedCourseId));
    } else if (courseIdRaw !== undefined && courseIdRaw !== null) {
      console.warn('AuthService: courseId recibido pero no válido:', courseIdRaw);
    }

    const nombre = profile.nombre || profile.usuario?.nombre || '';
    const apellidos = profile.apellidos || profile.usuario?.apellidos || '';
    const nombreCompleto = `${nombre} ${apellidos}`.trim();
    if (nombreCompleto) {
      localStorage.setItem('nombreCompleto', nombreCompleto);
    }

    let resolvedRole = this.getRole();
    if (roleRaw) {
      resolvedRole = roleRaw.toString().toLowerCase().includes('prof') || roleRaw.toString().toLowerCase().includes('admin')
        ? 'profesor'
        : 'alumno';
    } else if (typeof idRoleRaw === 'number') {
      resolvedRole = idRoleRaw === 1 ? 'profesor' : 'alumno';
    }
    localStorage.setItem('role', resolvedRole);

    this.emitAuthState();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token') && !!localStorage.getItem('email');
  }

  getUsername(): string {
    return localStorage.getItem('email') || '';
  }

  getEmail(): string {
    return localStorage.getItem('email') || '';
  }

  getNombreCompleto(): string {
    return localStorage.getItem('nombreCompleto') || '';
  }

  getCourseId(): number {
    const raw = localStorage.getItem('courseId');
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  setCourseId(courseId: number) {
    if (Number.isFinite(courseId) && courseId > 0) {
      localStorage.setItem('courseId', String(courseId));
      this.emitAuthState();
    }
  }

  getRole(): 'alumno' | 'profesor' {
    return (localStorage.getItem('role') as 'alumno' | 'profesor') || 'alumno';
  }

  getStudentId(): number {
    const username = this.getUsername();
    const match = username.match(/\d+/);
    const parsedId = match ? parseInt(match[0], 10) : 101;
    return parsedId;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('courseId');
    localStorage.removeItem('nombreCompleto');
    console.log('AuthService: Sesión eliminada.');

    this.authStateSubject.next({
      isLoggedIn: false,
      username: '',
      email: '',
      courseId: 1,
      role: 'alumno'
    });
  }

  private emitAuthState() {
    this.authStateSubject.next({
      isLoggedIn: this.isLoggedIn(),
      username: this.getUsername(),
      email: this.getEmail(),
      courseId: this.getCourseId(),
      role: this.getRole()
    });
  }
}