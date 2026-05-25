import { Component } from '@angular/core';

@Component({
  selector: 'app-attendance-incidents',
  standalone: true,
  templateUrl: './attendance-incidents.component.html',
  styleUrls: ['./attendance-incidents.component.css']
})
export class AttendanceIncidentsComponent {
  faltas = 2;
  retrasos = 1;
  justificados = 1;
}
