import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { Subscription } from 'rxjs';
import { AuthState } from '../services/auth.service';

@Component({
  selector: 'app-student-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-checkin.component.html',
  styleUrl: './student-checkin.component.css'
})
export class StudentCheckinComponent implements OnInit, OnDestroy {
  username = '';
  studentId = 101;
  role = 'alumno';
  loading = false;
  private authSub?: Subscription;

  // Status state
  rondaActual: any = null;
  checkinStatus: 'idle' | 'success' | 'error' = 'idle';
  statusMessage = '';
  yaFicho = false;     // true when the student already has a check-in for today's session
  fichajeHoy: any = null; // the existing check-in record if any



  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router
  ) { }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Initialize from current auth state
    this.username = this.authService.getUsername();
    this.studentId = this.authService.getStudentId();
    this.role = this.authService.getRole();

    if (this.role !== 'alumno') {
      this.router.navigate(['/home']);
      return;
    }

    this.loadRondaStatus();

    // Subscribe to auth state to react to login/logout changes
    this.authSub = this.authService.authState$.subscribe((s: AuthState) => {
      if (!s.isLoggedIn) {
        this.router.navigate(['/login']);
        return;
      }
      // If role changed to non-alumno, redirect to home
      if (s.role !== 'alumno') {
        this.router.navigate(['/home']);
        return;
      }
      // Update username/studentId if changed
      this.username = s.username;
      const currentStudentId = this.authService.getStudentId();
      if (currentStudentId !== this.studentId) {
        this.studentId = currentStudentId;
        this.loadRondaStatus();
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadRondaStatus() {
    this.studentService.getRondaActual().subscribe({
      next: (ronda) => {
        this.rondaActual = ronda;
        if (ronda?.id) {
          // Check whether this student already has a record in today's session
          this.studentService.getFichajesPorSesion(String(ronda.id)).subscribe({
            next: (res: any) => {
              const registros: any[] = res?.data || [];
              const mioRegistro = registros.find((f: any) => Number(f.studentId) === this.studentId);
              if (mioRegistro) {
                this.yaFicho = true;
                this.fichajeHoy = mioRegistro;
                this.checkinStatus = 'success';
                this.statusMessage = `Ya has fichado hoy a las ${new Date(mioRegistro.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} (${mioRegistro.metodo || 'Automático'}).`;
              }
            },
            error: () => {} // silently ignore — session may have no records yet
          });
        }
      },
      error: (err) => console.error('Error al cargar la ronda de hoy:', err)
    });
  }

  fichar(type: 'Entrada' | 'Salida') {
    if (this.yaFicho) {
      this.checkinStatus = 'error';
      this.statusMessage = 'Ya has registrado tu asistencia para la sesión de hoy. No es posible fichar de nuevo.';
      return;
    }
    this.loading = true;
    this.checkinStatus = 'idle';
    this.statusMessage = '';

    console.log(`Detectando IP y Hostname de forma automática...`);

    this.studentService.detectarConexion().subscribe({
      next: (conn: any) => {
        const detectedHostname = conn.hostname || '';
        const nombreCompleto = this.authService.getNombreCompleto() || `Estudiante #${this.studentId}`;
        this.studentService.ficharAlumno(this.studentId, type, detectedHostname, nombreCompleto).subscribe({
          next: (res: any) => {
            this.loading = false;
            this.checkinStatus = 'success';
            this.yaFicho = true;
            this.statusMessage = `¡Fichaje de ${type} realizado con éxito! Registrado desde ${res.hostname} (${res.ip}).`;
          },
          error: (err: any) => {
            this.loading = false;
            this.checkinStatus = 'error';
            this.statusMessage = err.error?.message || 'Error al conectar con la base de datos o validar el equipo.';
            console.error('Error en ficharAlumno():', err);
          }
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.checkinStatus = 'error';
        this.statusMessage = 'No se pudo detectar la conexión de tu equipo. Verifica tu red.';
        console.error('Error en detectarConexion():', err);
      }
    });
  }
}
