import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AuthState } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  username = '';
  email = '';
  role: 'alumno' | 'profesor' = 'alumno';
  isDropdownOpen = false;
  private authSub?: Subscription;

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.refreshUser();
    // Subscribe to auth state so header updates on login/logout
    this.authSub = this.authService.authState$.subscribe((s: AuthState) => {
      this.username = s.username;
      this.email = s.email;
      this.role = s.role;
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  // Comprobar rol actual
  refreshUser() {
    this.username = this.authService.getUsername();
    this.email = this.authService.getEmail();
    this.role = this.authService.getRole();
  }

  isFicharPage(): boolean {
    return this.router.url.includes('/fichar');
  }

  isProfilePage(): boolean {
    return this.router.url.includes('/perfil');
  }

  isAsistenciaPage(): boolean {
    return this.router.url.includes('/asistencia');
  }

  isRondasPage(): boolean {
    return this.router.url.includes('/rondas');
  }

  isFichajesPage(): boolean {
    return this.router.url.includes('/sesiones/fichajes');
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.isDropdownOpen = false;
    }
  }

  logout() {
    this.isDropdownOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

