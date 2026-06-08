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
  


  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router
  ) {}

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
      this.studentId = this.authService.getStudentId();
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadRondaStatus() {
    this.studentService.getRondaActual().subscribe({
      next: (ronda) => {
        this.rondaActual = ronda;
      },
      error: (err) => console.error('Error al cargar la ronda de hoy:', err)
    });
  }

  fichar(type: 'Entrada' | 'Salida') {
    this.loading = true;
    this.checkinStatus = 'idle';
    this.statusMessage = '';

    console.log(`Detectando IP y Hostname de forma automática...`);

    this.studentService.detectarConexion().subscribe({
      next: (conn: any) => {
        const detectedHostname = conn.hostname || '';
        const detectedIp = conn.ip || '';
        console.log(`Conexión detectada -> IP: ${detectedIp}, Hostname: ${detectedHostname}`);

        this.studentService.ficharAlumno(this.studentId, type, detectedHostname).subscribe({
          next: (res: any) => {
            this.loading = false;
            this.checkinStatus = 'success';
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
