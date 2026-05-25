import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'teacher-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-attendance.component.html',
  styleUrls: ['./teacher-attendance.component.css']
})
export class TeacherAttendanceComponent {
  externalStudentId = '';
  sessionId = '';
  reason = '';
  loading = false;
  message = '';

  constructor(private http: HttpClient) {}

  async submitManual() {
    this.message = '';
    if (!this.externalStudentId || !this.sessionId || !this.reason) {
      this.message = 'Por favor, completa todos los campos.';
      return;
    }
    this.loading = true;
    try {
      const body = {
        externalStudentId: this.externalStudentId,
        sessionId: this.sessionId,
        reason: this.reason
      };
      const res: any = await this.http.post('/api/admin/attendance-manual', body).toPromise();
      this.message = res?.message ?? 'Fichaje manual registrado.';
      this.externalStudentId = '';
      this.sessionId = '';
      this.reason = '';
    } catch (err: any) {
      this.message = err?.error?.message ?? 'Error al registrar fichaje manual.';
    } finally {
      this.loading = false;
    }
  }
}
