import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'student-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-attendance.component.html',
  styleUrls: ['./student-attendance.component.css']
})
export class StudentAttendanceComponent {
  externalStudentId = '';
  sessionId = '';
  deviceHostname = window?.location?.hostname ?? '';
  loading = false;
  message = '';

  constructor(private http: HttpClient) {}

  async checkIn() {
    this.message = '';
    if (!this.externalStudentId || !this.sessionId) {
      this.message = 'Por favor, introduce tu ID de estudiante y el ID de la sesión.';
      return;
    }
    this.loading = true;
    try {
      const body = {
        externalStudentId: this.externalStudentId,
        sessionId: this.sessionId,
        deviceHostname: this.deviceHostname
      };
      const res: any = await this.http.post('/api/attendance/student', body).toPromise();
      this.message = res?.message ?? 'Fichaje realizado.';
    } catch (err: any) {
      this.message = err?.error?.message ?? 'Error al fichar. Inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }
}
