import { Component } from '@angular/core';

@Component({
  selector: 'app-attendance-incident-list',
  standalone: true,
  templateUrl: './attendance-incident-list.component.html',
  styleUrls: ['./attendance-incident-list.component.css']
})
export class AttendanceIncidentListComponent {
  incidents = [
    { date: '2026-05-01', type: 'Falta', motivo: 'Sin justificar' },
    { date: '2026-05-03', type: 'Retraso', motivo: 'Tráfico' },
    { date: '2026-05-10', type: 'Falta', motivo: 'Justificada' },
    { date: '2026-05-15', type: 'Retraso', motivo: 'Médico' }
  ];
}
