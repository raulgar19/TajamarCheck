import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { StudentService } from '../home/student.service';

@Component({
  selector: 'app-student-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-checkin.component.html',
  styleUrl: './student-checkin.component.css'
})
export class StudentCheckinComponent implements OnInit {
  username = '';
  studentId = 101;
  role = 'alumno';
  loading = false;
  
  // Status state
  rondaActual: any = null;
  checkinStatus: 'idle' | 'success' | 'error' = 'idle';
  statusMessage = '';
  
  // Dev override for local testing of Hostnames
  devHostname = 'AULA-LOCAL-PC';

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

    this.username = this.authService.getUsername();
    this.studentId = this.authService.getStudentId();
    this.role = this.authService.getRole();

    if (this.role !== 'alumno') {
      // Los profesores no fichan de forma autónoma
      this.router.navigate(['/home']);
      return;
    }

    this.loadRondaStatus();
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

    console.log(`Fichando ${type} para alumno ${this.studentId} con PC local de pruebas ${this.devHostname}`);

    this.studentService.ficharAlumno(this.studentId, type, this.devHostname).subscribe({
      next: (res) => {
        this.loading = false;
        this.checkinStatus = 'success';
        this.statusMessage = `¡Fichaje de ${type} realizado con éxito! Registrado desde ${res.hostname} (${res.ip}).`;
      },
      error: (err) => {
        this.loading = false;
        this.checkinStatus = 'error';
        this.statusMessage = err.error?.message || 'Error al conectar con la base de datos o validar el equipo.';
        console.error('Error en fichar():', err);
      }
    });
  }
}
