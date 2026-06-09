import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { AuthState } from '../services/auth.service';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  // Toast notification
  toast = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };
  private toastTimeout: any;

  // Modal de justificación (profesor)
  mostrarModalJustificar = false;
  justificacionForm = {
    idAsistencia: 0,
    studentName: '',
    texto: ''
  };

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
      if (sid && this.sessions && this.sessions.length > 0) {
        const found = this.sessions.find(s => (s.id || s.Id) == sid);
        if (found) this.selectSession(found);
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
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { show: true, message, type };
    this.toastTimeout = setTimeout(() => { this.toast.show = false; }, 4000);
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

  recargarSesionActual() {
    this.studentService.getRondaActual().subscribe({
      next: (r) => {
        if (r?.id) {
          const found = this.sessions.find(s => (s.id || s.Id) == r.id);
          if (found) {
            this.selectSession(found);
          } else {
            // Si no está en la lista, recargar todo
            this.loadSessions();
          }
        } else {
          this.showToast('No hay sesión abierta en este momento.', 'warning');
        }
      },
      error: () => this.showToast('No se pudo conectar con el servidor.', 'error')
    });
  }

  // ==========================================
  // GETTERS Y HELPERS
  // ==========================================

  get uniqueStudentsCount(): number {
    return new Set(this.attendees.map((a: any) => a.studentId)).size;
  }

  get presentesCount(): number {
    return this.attendees.filter((a: any) => a.tipo === 'Entrada' || a.tipo === 'Presente').length;
  }

  get faltasCount(): number {
    return this.attendees.filter((a: any) => a.tipo === 'Falta').length;
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

  getStudentName(studentId: any): string {
    const idNum = Number(studentId);
    const students: { [key: number]: string } = {
      1: 'Raúl García',
      2: 'Sofia Martín',
      3: 'Carlos Gomez',
      4: 'Ana Belén Ortiz',
      101: 'Estudiante Tajamar (Pruebas)'
    };
    return students[idNum] || `Alumno #${studentId}`;
  }

  getTipoBadgeClass(tipo: string): string {
    if (tipo === 'Entrada' || tipo === 'Presente') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
    if (tipo === 'Retraso') return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
    if (tipo === 'Falta') return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
    return 'bg-white/5 text-slate-400 border border-white/10';
  }

  getTipoLabel(tipo: string): string {
    if (tipo === 'Entrada') return 'Presente';
    return tipo || '-';
  }

  // ==========================================
  // JUSTIFICACIÓN (ACCIONES DEL PROFESOR)
  // ==========================================

  abrirModalJustificar(attendee: any) {
    this.justificacionForm = {
      idAsistencia: attendee.id,
      studentName: attendee.studentName || this.getStudentName(attendee.studentId),
      texto: attendee.text || ''
    };
    this.mostrarModalJustificar = true;
  }

  guardarJustificacion() {
    if (!this.justificacionForm.texto.trim()) {
      this.showToast('Por favor, escribe el motivo de la justificación.', 'warning');
      return;
    }
    this.studentService.justificarFaltaTeacher(
      this.justificacionForm.idAsistencia,
      this.justificacionForm.texto.trim()
    ).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Falta justificada con éxito.', 'success');
        this.mostrarModalJustificar = false;
        this.loadAttendees(this.getSessionId(this.selectedSession));
      },
      error: (err) => {
        this.showToast('Error al justificar la falta: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  revisarJustificacion(attendeeId: number, aceptar: boolean) {
    this.studentService.revisarJustificacion(attendeeId, aceptar).subscribe({
      next: (res) => {
        this.showToast(res.message || (aceptar ? 'Justificación aceptada.' : 'Justificación rechazada.'), 'success');
        this.loadAttendees(this.getSessionId(this.selectedSession));
      },
      error: (err) => {
        this.showToast('Error al revisar la justificación: ' + (err.error?.message || err.message), 'error');
      }
    });
  }
}
