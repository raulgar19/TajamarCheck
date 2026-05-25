export interface AttendanceStudentRequest {
  externalStudentId: string;
  sessionId: string;
  deviceHostname: string;
}

export interface AttendanceManualRequest {
  externalStudentId: string;
  sessionId: string;
  reason: string;
}

export interface AttendanceApiResponse {
  success: boolean;
  message: string;
  attendanceId?: string;
  externalStudentId?: string;
}

export const attendanceRoutePaths = {
  student: 'attendance/student',
  teacher: 'attendance/teacher'
} as const;