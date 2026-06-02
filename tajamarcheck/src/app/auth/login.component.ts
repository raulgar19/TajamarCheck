import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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

  constructor(
    private http: HttpClient, 
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('LoginComponent: Iniciando componente...');
    if (this.authService.isLoggedIn()) {
      console.log('LoginComponent: Sesión activa encontrada. Redirigiendo a home...');
      const currentRole = this.authService.getRole();
      this.router.navigate(['/home'], { queryParams: { role: currentRole } });
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
            // Intentar extraer email real de la respuesta si viene en alguna propiedad común
            let email: string | undefined = undefined;
            try {
              if (res && typeof res === 'object') {
                email = (res.email || res.emailAddress || res.mail || res.user?.email || res.response?.email) as string | undefined;
              }
            } catch (e) {
              // ignore extraction errors
            }

            // If username looks like an email, prefer that when no explicit email returned
            if (!email && this.username.includes('@')) {
              email = this.username;
            }

            // Intentar extraer rol y curso desde la respuesta (ej: "PROFESOR" o "ALUMNO")
            let apiRole: string | undefined = undefined;
            try {
              if (res && typeof res === 'object') {
                apiRole = (res.role || res.roleName || (res.idrole ? (res.idrole === 1 ? 'PROFESOR' : 'ALUMNO') : undefined)) as string | undefined;
              }
            } catch (e) {}

            // Mapear rol de API a valores internos ('profesor' | 'alumno') y guardar sesión con rol explícito
            this.authService.saveSession(token, this.username, email, apiRole);
            console.log('LoginComponent: Sesión guardada con éxito. Navegando a Home...');

            // Navegar al home; añadimos query param con rol para que el componente pueda reaccionar si lo necesita
            const mappedRole = apiRole && apiRole.toString().toLowerCase().includes('prof') ? 'profesor' : 'alumno';
            this.router.navigate(['/home'], { queryParams: { role: mappedRole } });
          } else {
            console.error('LoginComponent: La respuesta no contiene un formato de token conocido:', res);
            this.error = 'No se pudo recuperar el token de la respuesta.';
          }
        },
        error: (err) => {
          console.error('LoginComponent: Error en la petición HTTP:', err);
          this.loading = false;
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
