import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-lista-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-asistencia.component.html',
  styleUrl: './lista-asistencia.component.css'
})
export class ListaAsistenciaComponent implements OnInit, OnDestroy {
  studentId = 0;
  role: 'alumno' | 'profesor' = 'alumno';
  username = '';
  
  loading = false;
  absencesCount = 0;
  delaysCount = 0;
  attendancePercentage = 100;

  // Raw lists
  absences: any[] = [];
  logs: any[] = [];

  // Unified list
  incidences: any[] = [];
  filteredIncidences: any[] = [];

  // Filters
  filterType: 'all' | 'absence' | 'delay' = 'all';
  filterSubject = '';

  private querySub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.role = this.authService.getRole();
    if (this.role !== 'alumno') {
      // Absences/delays list is only for students
      this.router.navigate(['/home']);
      return;
    }

    this.studentId = this.authService.getStudentId();
    this.username = this.authService.getUsername();

    this.loadData();
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }

  loadData() {
    this.loading = true;
    
    // Fetch absences and logs in parallel
    forkJoin({
      absences: this.studentService.getAbsences(this.studentId),
      logs: this.studentService.getLogs(this.studentId)
    }).subscribe({
      next: (res) => {
        this.absences = res.absences || [];
        this.logs = res.logs || [];

        this.absencesCount = this.absences.length;
        const delays = this.logs.filter(l => l.type && l.type.toLowerCase() === 'retraso');
        this.delaysCount = delays.length;
        this.recalculatePercentage();

        this.unifyIncidences();

        // Subscribe to query parameters to pre-apply filters from query
        this.querySub = this.route.queryParams.subscribe(params => {
          const tipo = params['tipo'];
          if (tipo === 'falta') {
            this.filterType = 'absence';
          } else if (tipo === 'retraso') {
            this.filterType = 'delay';
          } else {
            this.filterType = 'all';
          }
          this.applyFilters();
        });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos de asistencia:', err);
        this.loading = false;
      }
    });
  }

  recalculatePercentage() {
    const totalDays = 60; // Simulation of total school days
    const missed = this.absencesCount + (this.delaysCount * 0.25); // Delays deduct a quarter day
    const pct = ((totalDays - missed) / totalDays) * 100;
    this.attendancePercentage = parseFloat(Math.max(0, Math.min(100, pct)).toFixed(1));
  }

  unifyIncidences() {
    const mappedAbsences = this.absences.map(a => ({
      id: a.id,
      type: 'Falta',
      subject: a.subject,
      date: new Date(a.date),
      time: a.time,
      minutes: null,
      text: 'Falta de asistencia registrada.'
    }));

    const mappedDelays = this.logs
      .filter(l => l.type && l.type.toLowerCase() === 'retraso')
      .map(d => ({
        id: d.id,
        type: 'Retraso',
        subject: d.subject,
        date: new Date(d.date),
        time: d.time,
        minutes: d.minutes,
        text: d.text || `${d.minutes} min de retraso.`
      }));

    // Combine
    this.incidences = [...mappedAbsences, ...mappedDelays];

    // Sort chronologically descending (newest first)
    this.incidences.sort((a, b) => {
      const timeA = a.date.getTime();
      const timeB = b.date.getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return b.time.localeCompare(a.time);
    });

    this.applyFilters();
  }

  applyFilters() {
    let result = this.incidences;

    // Filter type
    if (this.filterType === 'absence') {
      result = result.filter(i => i.type === 'Falta');
    } else if (this.filterType === 'delay') {
      result = result.filter(i => i.type === 'Retraso');
    }

    // Filter subject name (case-insensitive)
    if (this.filterSubject && this.filterSubject.trim() !== '') {
      const query = this.filterSubject.toLowerCase().trim();
      result = result.filter(i => i.subject && i.subject.toLowerCase().includes(query));
    }

    this.filteredIncidences = result;
  }

  clearFilters() {
    this.filterType = 'all';
    this.filterSubject = '';
    this.applyFilters();
  }
}
