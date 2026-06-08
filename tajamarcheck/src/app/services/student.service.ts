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

  getRondas(): Observable<any[]> {
    return this.http.get<any[]>('/api/attendance/rondas');
  }

  getAttendees(sessionId: string): Observable<any> {
    return this.http.get<any>(`/api/attendance/rondas/${sessionId}/asistentes`);
  }

  getFichajesPorSesion(sessionId: string): Observable<any> {
    return this.http.get<any>(`/api/attendance/fichajes/sesion/${sessionId}`);
  }

  detectarConexion(): Observable<any> {
    return this.http.get<any>('/api/attendance/equipos/detectar-conexion');
  }

  ficharAlumno(studentId: number, type: string, devHostname?: string, nombreUsuario?: string): Observable<any> {
    return this.http.post<any>('/api/attendance/fichar/alumno', {
      studentId: studentId,
      nombreUsuario: nombreUsuario,
      type: type,
      devHostname: devHostname
    });
  }

  registrarAsistenciaManual(payload: { studentId: number; sessionId: string; type?: string; minutes?: number; text?: string; nombreUsuario?: string }): Observable<any> {
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

  justificarFalta(absenceId: number, text: string): Observable<any> {
    return this.http.post<any>(`/api/attendance/absences/${absenceId}/justify`, {
      justificacion: text
    });
  }

  justificarFaltaTeacher(absenceId: number, text: string): Observable<any> {
    return this.http.post<any>(`/api/attendance/absences/${absenceId}/justify-teacher`, {
      justificacion: text
    });
  }

  revisarJustificacion(absenceId: number, aceptar: boolean): Observable<any> {
    return this.http.post<any>(`/api/attendance/absences/${absenceId}/review-justification`, {
      aceptar: aceptar
    });
  }
}