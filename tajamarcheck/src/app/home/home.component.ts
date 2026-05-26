import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  username = '';
  token = '';
  showToken = false;
  
  // Estadísticas simplificadas: Asistencia, Faltas y Retrasos
  attendancePercentage = 96.4;
  absencesCount = 3;
  delaysCount = 2;

  // Lista simplificada de faltas
  absences = [
    { id: 1, subject: 'Matemáticas Aplicadas', date: '25 May, 2026', time: '09:00 - 10:00' },
    { id: 2, subject: 'Programación .NET Core', date: '20 May, 2026', time: '11:30 - 13:30' },
    { id: 3, subject: 'Programación .NET Core', date: '18 May, 2026', time: '08:30 - 10:30' }
  ];

  // Lista de retrasos
  delays = [
    { id: 101, subject: 'Programación .NET Core', date: '12 May, 2026', time: '11:45', minutes: 15, text: '15 min de retraso' },
    { id: 102, subject: 'Matemáticas Aplicadas', date: '14 May, 2026', time: '09:10', minutes: 10, text: '10 min de retraso' }
  ];

  // Historial de registros (fichajes de entrada/salida y retrasos)
  attendanceLogs = [
    { id: 201, type: 'Entrada', subject: 'Programación .NET Core', date: '26 May, 2026', time: '08:28', badgeColor: 'bg-emerald-50 border-emerald-150 text-emerald-700', icon: 'E', text: 'Entrada registrada' },
    { id: 202, type: 'Salida', subject: 'Programación .NET Core', date: '26 May, 2026', time: '14:30', badgeColor: 'bg-slate-50 border-slate-200 text-slate-600', icon: 'S', text: 'Salida registrada' },
    { id: 203, type: 'Entrada', subject: 'Matemáticas Aplicadas', date: '25 May, 2026', time: '08:55', badgeColor: 'bg-emerald-50 border-emerald-150 text-emerald-700', icon: 'E', text: 'Entrada registrada' },
    { id: 204, type: 'Salida', subject: 'Matemáticas Aplicadas', date: '25 May, 2026', time: '12:05', badgeColor: 'bg-slate-50 border-slate-200 text-slate-600', icon: 'S', text: 'Salida registrada' },
    { id: 102, type: 'Retraso', subject: 'Matemáticas Aplicadas', date: '14 May, 2026', time: '09:10', badgeColor: 'bg-violet-50 border-violet-150 text-violet-700', icon: 'R', text: '10 min de retraso' },
    { id: 101, type: 'Retraso', subject: 'Programación .NET Core', date: '12 May, 2026', time: '11:45', badgeColor: 'bg-violet-50 border-violet-150 text-violet-700', icon: 'R', text: '15 min de retraso' }
  ];

  // Calendario
  calendarDays: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // Comprobar si el usuario está autenticado
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');

    if (!savedToken || !savedUser) {
      console.warn('HomeComponent: Acceso no autorizado. Redirigiendo a login.');
      this.router.navigate(['/login']);
    } else {
      this.token = savedToken;
      this.username = savedUser;
      console.log('HomeComponent: Sesión autorizada para:', this.username);
      this.generateCalendar();
    }
  }

  generateCalendar() {
    const days = [];
    // Mayo 2026 empieza en Viernes (4 espacios vacíos para L, M, X, J)
    for (let i = 0; i < 4; i++) {
      days.push({ dayNumber: null, status: 'empty' });
    }
    
    for (let d = 1; d <= 31; d++) {
      const absence = this.absences.find(a => a.date.startsWith(`${d} May`));
      const delay = this.delays.find(de => de.date.startsWith(`${d} May`));
      
      let status = 'present';
      let subject = null;
      
      if (absence) {
        status = 'absence';
        subject = absence.subject;
      } else if (delay) {
        status = 'delay';
        subject = `${delay.subject} (${delay.text})`;
      }
      
      days.push({
        dayNumber: d,
        status: status,
        absenceSubject: subject
      });
    }
    this.calendarDays = days;
  }

  logout() {
    console.log('HomeComponent: Cerrando sesión y limpiando datos...');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }
}
