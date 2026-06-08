import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StudentService } from '../services/student.service';

@Component({
  selector: 'app-session-checkins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-checkins.component.html',
  styleUrl: './session-checkins.component.css'
})
export class SessionCheckinsComponent implements OnInit {
  rondas: any[] = [];
  rondaActual: any = null;
  selectedSessionId = '';
  selectedSession: any = null;
  fichajes: any[] = [];
  loading = false;
  error = '';
  loadedFromQuery = false;

  constructor(
    private studentService: StudentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadRondas();
    this.loadRondaActual();
    const sessionId = this.route.snapshot.queryParamMap.get('sessionId');
    if (sessionId) {
      this.loadedFromQuery = true;
      this.loadFichajesSesion(sessionId);
    }
  }

  loadRondas() {
    this.loading = true;
    this.studentService.getRondas().subscribe({
      next: (res) => { this.rondas = res || []; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  loadRondaActual() {
    this.studentService.getRondaActual().subscribe({
      next: (r) => {
        this.rondaActual = r;
        if (!this.loadedFromQuery && r?.id) {
          this.loadFichajesSesion(r.id);
        }
      },
      error: (err) => console.error(err)
    });
  }

  openCurrentSession() {
    if (this.rondaActual?.id) {
      this.loadFichajesSesion(this.rondaActual.id);
    }
  }

  loadFichajesActual() {
    this.openCurrentSession();
  }

  loadFichajesSesion(sessionId?: string) {
    const targetSessionId = sessionId || this.selectedSessionId;
    if (!targetSessionId) return;

    this.loading = true;
    this.error = '';
    this.selectedSessionId = targetSessionId;

    this.studentService.getFichajesPorSesion(targetSessionId).subscribe({
      next: (res: any) => {
        this.fichajes = res?.data || [];
        this.selectedSession = res?.session || null;
        if (res?.session?.id) {
          this.selectedSessionId = res.session.id;
        }
        this.loading = false;
      },
      error: (err: any) => { this.error = err?.error?.message || err.message; this.loading = false; }
    });
  }

  get uniqueStudentsCount(): number {
    return new Set(this.fichajes.map(f => f.studentId)).size;
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
}
