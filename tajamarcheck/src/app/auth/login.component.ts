
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private router: Router) {}

  login() {
    this.error = '';
    this.loading = true;
    // Aquí iría la lógica real de autenticación
    setTimeout(() => {
      if (this.username === 'admin' && this.password === 'admin') {
        this.router.navigate(['/home']);
      } else {
        this.error = 'Usuario o contraseña incorrectos';
      }
      this.loading = false;
    }, 800);
  }
}
