import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './attendance-calendar.component.html',
  styleUrls: ['./attendance-calendar.component.css']
})
export class AttendanceCalendarComponent {
  // Simulación de días con faltas/retrasos
  days = [
    { date: '2026-05-01', type: 'falta', motivo: 'Sin justificar' },
    { date: '2026-05-03', type: 'retraso', motivo: 'Tráfico' },
    { date: '2026-05-10', type: 'falta', motivo: 'Justificada' },
    { date: '2026-05-15', type: 'retraso', motivo: 'Médico' }
  ];
  today = new Date();
  getMonthDays() {
    const year = this.today.getFullYear();
    const month = this.today.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // En JS, 0=domingo, 1=lunes, ..., 6=sábado. Queremos que 1=lunes, 7=domingo
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 7 : startDay; // 0 (domingo) -> 7
    // Añade celdas vacías al principio si el mes no empieza en lunes
    for (let i = 1; i < startDay; i++) {
      days.push({ empty: true });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
      const info = this.days.find(x => x.date === dateStr);
      days.push({
        date: dateStr,
        day: d,
        type: info?.type,
        motivo: info?.motivo
      });
    }
    return days;
  }
}
