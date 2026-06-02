import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { Subscription } from 'rxjs';
import { AuthState } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  username = '';
  role: 'alumno' | 'profesor' = 'alumno';
  
  // Clean Core Profile Details
  fullName = '';
  email = '';
  course = '';
  isActive = true;
  avatarUrl = '';
  
  loading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  private authSub?: Subscription;

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();
    this.email = this.authService.getEmail() || this.username;
    const storedCourseId = this.authService.getCourseId();
    if (storedCourseId > 0) {
      this.course = `Curso ${storedCourseId}`;
    }
    
    // Attempt to load profile from the real external API of Tajamar
    const token = localStorage.getItem('token') || '';
    if (token) {
      this.loading = true;
      this.studentService.getExternalProfile(token).subscribe({
        next: (res) => {
          if (res && res.usuario) {
            const user = res.usuario;
            this.fullName = `${user.nombre} ${user.apellidos}`;
            this.email = user.email;
            this.course = user.curso || 'Master Desarrollo Apps Cloud 2025-2026';
            this.avatarUrl = user.imagen || '';
            this.isActive = user.estadoUsuario !== false; // boolean
            this.role = user.role.toLowerCase() === 'alumno' ? 'alumno' : 'profesor';
            const courseId = this.extractCourseId(user);
            if (courseId > 0) {
              this.authService.setCourseId(courseId);
            }
          } else {
            this.loadFallbackDetails();
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando perfil de Charlas Tajamar:', err);
          this.loadFallbackDetails();
          this.loading = false;
        }
      });
    } else {
      this.loadFallbackDetails();
    }

    // Subscribe to auth state and refresh profile when user changes
    this.authSub = this.authService.authState$.subscribe((s: AuthState) => {
      if (!s.isLoggedIn) {
        this.router.navigate(['/login']);
        return;
      }
      if (s.username !== this.username || s.role !== this.role) {
        this.username = s.username;
        this.role = s.role;
        this.email = s.email || s.username;
        // Try reload external profile
        const tk = localStorage.getItem('token') || '';
        if (tk) {
          this.loading = true;
          this.studentService.getExternalProfile(tk).subscribe({
            next: (res) => {
              if (res && res.usuario) {
                const user = res.usuario;
                this.fullName = `${user.nombre} ${user.apellidos}`;
                this.email = user.email;
                this.course = user.curso || 'Master Desarrollo Apps Cloud 2025-2026';
                this.avatarUrl = user.imagen || '';
                this.isActive = user.estadoUsuario !== false;
                this.role = user.role.toLowerCase() === 'alumno' ? 'alumno' : 'profesor';
                const courseId = this.extractCourseId(user);
                if (courseId > 0) {
                  this.authService.setCourseId(courseId);
                }
              } else {
                this.loadFallbackDetails();
              }
              this.loading = false;
            },
            error: (err) => {
              console.error('Error recargando perfil tras cambio de sesión:', err);
              this.loadFallbackDetails();
              this.loading = false;
            }
          });
        } else {
          this.loadFallbackDetails();
        }
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadFallbackDetails() {
    this.isActive = true;
    if (this.role === 'profesor') {
      this.fullName = 'Marta Sánchez Ruiz';
      this.course = 'Master Full Stack - Sistemas Web & Arquitectura Cloud';
    } else {
      this.fullName = 'Raúl García López';
      this.course = 'Master Full Stack - Especialidad en .NET Core & Angular (2026)';
    }
  }

  private extractCourseId(user: any): number {
    const raw = user?.cursoId ?? user?.courseId ?? user?.curso?.id ?? user?.course?.id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
