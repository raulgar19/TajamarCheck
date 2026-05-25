import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AttendanceApiResponse, AttendanceManualRequest, AttendanceStudentRequest } from './attendance.models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly apiBaseUrl = '/api';

  constructor(private readonly httpClient: HttpClient) {}

  registerStudentAttendance(request: AttendanceStudentRequest): Observable<AttendanceApiResponse> {
    return this.httpClient.post<AttendanceApiResponse>(`${this.apiBaseUrl}/attendance/student`, request);
  }

  registerManualAttendance(request: AttendanceManualRequest): Observable<AttendanceApiResponse> {
    return this.httpClient.post<AttendanceApiResponse>(`${this.apiBaseUrl}/admin/attendance-manual`, request);
  }
}