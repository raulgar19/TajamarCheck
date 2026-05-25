import { Component } from '@angular/core';
import { AttendancePercentageComponent } from './attendance/attendance-percentage.component';
import { AttendanceIncidentsComponent } from './attendance/attendance-incidents.component';
import { AttendanceCalendarComponent } from './attendance/attendance-calendar.component';
import { AttendanceIncidentListComponent } from './attendance/attendance-incident-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AttendancePercentageComponent, AttendanceIncidentsComponent, AttendanceCalendarComponent, AttendanceIncidentListComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {}
