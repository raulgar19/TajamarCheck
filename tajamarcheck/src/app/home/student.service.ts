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

  // Obtener perfil externo desde API de Charlas Tajamar
  getExternalProfile(token: string): Observable<any> {
    return this.http.get<any>('https://apicharlasalumnostajamartesting.azurewebsites.net/api/Usuarios/Perfil', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Obtener ronda actual
  getRondaActual(): Observable<any> {
    return this.http.get<any>('/api/attendance/ronda-actual');
  }

  // Enviar fichaje de alumno
  ficharAlumno(studentId: number, type: string, devHostname?: string): Observable<any> {
    return this.http.post<any>('/api/attendance/fichar/alumno', {
      studentId: studentId,
      type: type,
      devHostname: devHostname
    });
  }
}
