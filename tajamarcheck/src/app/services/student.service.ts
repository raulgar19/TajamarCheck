import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private http: HttpClient) {}

  getAbsences(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/attendance/absences/${studentId}`);
  }

  getLogs(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/attendance/logs/${studentId}`);
  }

  getExternalProfile(token: string): Observable<any> {
    return this.http.get<any>('https://apicharlasalumnostajamartesting.azurewebsites.net/api/Usuarios/Perfil', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  getRondaActual(): Observable<any> {
    return this.http.get<any>('/api/attendance/ronda-actual');
  }

  getFichajesSesionActual(): Observable<any> {
    return this.http.get<any>('/api/attendance/fichajes/sesion-actual');
  }

  getFichajesPorSesion(sessionId: string): Observable<any> {
    return this.http.get<any>(`/api/attendance/fichajes/sesion/${sessionId}`);
  }

  getRondas(): Observable<any[]> {
    return this.http.get<any[]>('/api/attendance/rondas');
  }

  ficharAlumno(studentId: number, type: string, devHostname?: string): Observable<any> {
    return this.http.post<any>('/api/attendance/fichar/alumno', {
      studentId: studentId,
      type: type,
      devHostname: devHostname
    });
  }

  registrarAsistenciaManual(payload: { studentId: number; sessionId: string; type?: string; minutes?: number; text?: string }): Observable<any> {
    return this.http.post<any>('/api/admin/asistencia-manual', payload);
  }

  getDiario(date?: string): Observable<any> {
    const url = date ? `/api/attendance/diario?date=${date}` : '/api/attendance/diario';
    return this.http.get<any>(url);
  }

  clearDiario(studentId: number, date?: string): Observable<any> {
    const url = date ? `/api/attendance/diario/${studentId}?date=${date}` : `/api/attendance/diario/${studentId}`;
    return this.http.delete<any>(url);
  }
}