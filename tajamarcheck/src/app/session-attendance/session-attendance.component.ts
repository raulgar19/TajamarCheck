import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { AuthState } from '../services/auth.service';

@Component({
  selector: 'app-session-attendance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './session-attendance.component.html',
  styleUrl: './session-attendance.component.css'
})
export class SessionAttendanceComponent implements OnInit, OnDestroy {
  sessions: any[] = [];
  selectedSession: any = null;
  attendees: any[] = [];
  loading = false;
  username = '';
  role = '';
  private authSub?: Subscription;

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();

    if (this.role !== 'profesor') {
      this.router.navigate(['/home']);
      return;
    }

    this.loadSessions();

    this.authSub = this.authService.authState$.subscribe((s: AuthState) => {
      if (!s.isLoggedIn) {
        this.router.navigate(['/login']);
        return;
      }
      this.role = s.role;
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadSessions() {
    this.loading = true;
    this.studentService.getRondas().subscribe({
      next: (list) => {
        this.sessions = list || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando rondas:', err);
        this.loading = false;
      }
    });
  }

  selectSession(s: any) {
    this.selectedSession = s;
    this.loadAttendees(s.id || s.Id || s.id);
  }

  loadAttendees(sessionId: string) {
    if (!sessionId) return;
    this.attendees = [];
    this.loading = true;
    this.studentService.getAttendees(sessionId).subscribe({
      next: (res) => {
        this.attendees = res?.attendees || res?.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando asistentes:', err);
        this.loading = false;
      }
    });
  }
}
