import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { AuthState } from '../services/auth.service';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-attendance.component.html',
  styleUrl: './session-attendance.component.css'
})
export class SessionAttendanceComponent implements OnInit, OnDestroy {
  sessions: any[] = [];
  selectedSession: any = null;
  attendees: any[] = [];
  loading = false;
  errorMessage = '';
  username = '';
  role = '';
  private authSub?: Subscription;

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();

    if (this.role !== 'profesor') {
      this.router.navigate(['/home']);
      return;
    }

    this.loadSessions();

    // Si viene sessionId por query params, seleccionarla cuando se carguen las sesiones
    this.route.queryParams.subscribe(params => {
      const sid = params['sessionId'] as string | undefined;
      if (sid) {
        // Si ya hay sesiones cargadas, intentar seleccionar, si no, se seleccionará tras la carga
        if (this.sessions && this.sessions.length > 0) {
          const found = this.sessions.find(s => (s.id || s.Id || s.Id) == sid);
          if (found) this.selectSession(found);
        } else {
          // esperar a que loadSessions haga el trabajo (loadSessions ya pone sessions)
          // aquí no hacemos nada extra; loadSessions llamará a select cuando el usuario haga click
        }
      }
    });

    this.authSub = this.authService.authState$.subscribe((s: AuthState) => {
      if (!s.isLoggedIn) {
        this.router.navigate(['/login']);
        return;
      }
      this.role = s.role;
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadSessions() {
    this.loading = true;
    this.errorMessage = '';
    this.studentService.getRondas().subscribe({
      next: (list) => {
        this.sessions = list || [];
        this.loading = false;
        // Si venimos con sessionId en query params, intentar seleccionar automáticamente
        const sid = this.route.snapshot.queryParams['sessionId'] as string | undefined;
        if (sid) {
          const found = this.sessions.find(s => (s.id || s.Id) == sid);
          if (found) this.selectSession(found);
        }
      },
      error: (err) => {
        console.error('Error cargando rondas:', err);
        this.errorMessage = 'No se han podido cargar las rondas de asistencia.';
        this.loading = false;
      }
    });
  }

  selectSession(s: any) {
    this.selectedSession = s;
    this.loadAttendees(this.getSessionId(s));
  }

  loadAttendees(sessionId: string) {
    if (!sessionId) return;
    this.attendees = [];
    this.loading = true;
    this.errorMessage = '';
    this.studentService.getAttendees(sessionId).subscribe({
      next: (res) => {
        this.attendees = Array.isArray(res?.attendees) ? res.attendees : [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando asistentes:', err);
        this.errorMessage = err?.error?.message || 'No se han podido cargar los asistentes de esta sesión.';
        this.loading = false;
      }
    });
  }

  getSessionId(session: any): string {
    return session?.id || session?.Id || '';
  }

  getSessionDate(session: any): Date | string | null {
    return session?.fecha || session?.Fecha || session?.fechaHora || session?.FechaHora || null;
  }

  getSessionType(session: any): string {
    return session?.tipoClase || session?.TipoClase || 'Sesión';
  }

  isSelectedSession(session: any): boolean {
    if (!this.selectedSession || !session) return false;
    return this.getSessionId(this.selectedSession) === this.getSessionId(session);
  }
}
