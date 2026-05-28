import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { StudentService } from '../home/student.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
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

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();
    this.email = this.username;
    
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

  goBack() {
    this.router.navigate(['/home']);
  }
}
