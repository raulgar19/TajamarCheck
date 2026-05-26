import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    console.log('LoginComponent: Iniciando componente...');
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('username');
    if (token && savedUser) {
      console.log('LoginComponent: Sesión activa encontrada. Redirigiendo a home...');
      this.router.navigate(['/home']);
    }
  }

  login() {
    console.log('LoginComponent: Se presionó el botón de entrar');
    try {
      if (!this.username.trim() || !this.password.trim()) {
        this.error = 'Por favor, introduce el usuario y la contraseña.';
        console.warn('LoginComponent: Validación fallida (campos vacíos).');
        return;
      }

      this.error = '';
      this.loading = true;
      console.log('LoginComponent: Enviando petición a la API externa de Azure...', {
        url: 'https://apicharlasalumnostajamartesting.azurewebsites.net/api/Auth/Login',
        userName: this.username
      });

      // Petición directa a la API Externa de Azure (userName con N mayúscula)
      this.http.post<any>('https://apicharlasalumnostajamartesting.azurewebsites.net/api/Auth/Login', {
        userName: this.username,
        password: this.password
      }).subscribe({
        next: (res) => {
          console.log('LoginComponent: Respuesta exitosa recibida de la API:', res);
          this.loading = false;
          let token = '';
          if (res && typeof res === 'object') {
            token = res.response || res.token || res.tokenDeAcceso || JSON.stringify(res);
            console.log('LoginComponent: Token extraído de objeto de respuesta:', token);
          } else if (typeof res === 'string') {
            token = res;
            console.log('LoginComponent: Token recibido como cadena plana:', token);
          }

          if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('username', this.username);
            console.log('LoginComponent: Sesión guardada con éxito. Navegando a Home...');
            this.router.navigate(['/home']);
          } else {
            console.error('LoginComponent: La respuesta no contiene un formato de token conocido:', res);
            this.error = 'No se pudo recuperar el token de la respuesta.';
          }
        },
        error: (err) => {
          console.error('LoginComponent: Error en la petición HTTP:', err);
          this.loading = false;
          // Mostrar mensaje de error explícito requerido por el usuario
          this.error = 'Usuario o contraseña incorrectos.';
        }
      });
    } catch (e: any) {
      console.error('LoginComponent: Error síncrono capturado en login():', e);
      this.loading = false;
      this.error = 'Error interno al iniciar sesión: ' + e.message;
    }
  }
}
