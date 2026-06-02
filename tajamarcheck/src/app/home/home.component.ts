import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  username = '';
  role: 'alumno' | 'profesor' = 'alumno';
  studentId = 101;
  loading = false;
  private authSub?: Subscription;

  // ==========================================
  // ESTUDIANTE STATE
  // ==========================================
  attendancePercentage = 100;
  absencesCount = 0;
  delaysCount = 0;
  
  absences: any[] = [];
  delays: any[] = [];
  attendanceLogs: any[] = [];
  
  miPcAsignado: any = null;
  mostrarModalVincularPc = false;
  miPcForm = {
    nombre: '',
    ip: '10.203.0.1'
  };
  
  // Navigation for Multi-Month Calendar
  currentCalendarDate = new Date();
  calendarDays: any[] = [];
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // ==========================================
  // PROFESOR STATE
  // ==========================================
  rondaActual: any = null;
  rondaTipo = 'Presencial'; // Default
  rondaPermitirCambioPC = false;
  rondasHistorial: any[] = [];
  
  // CRUD de Equipos
  equipos: any[] = [];
  mostrarModalEquipo = false;
  editingEquipo: any = null;
  equipoForm = {
    id: '',
    nombreDispositivo: '',
    direccionIP: '127.0.0.1',
    activo: true
  };

  // Pase de Lista Manual
  estudiantesList = [
    { id: 1, name: 'Raúl García' },
    { id: 2, name: 'Sofia Martín' },
    { id: 3, name: 'Carlos Gomez' },
    { id: 4, name: 'Ana Belén Ortiz' },
    { id: 101, name: 'Estudiante Tajamar (Pruebas)' }
  ];
  mostrarModalManual = false;
  manualForm = {
    studentId: 1,
    type: 'Falta', // 'Falta' o 'Retraso'
    subject: 'Matemáticas Aplicadas',
    time: '09:00',
    date: new Date().toISOString().split('T')[0],
    minutes: 15,
    text: ''
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      console.warn('HomeComponent: Sesión inactiva. Redirigiendo a login.');
      this.router.navigate(['/login']);
      return;
    }

    // Inicializar con valores actuales
    this.username = this.authService.getUsername();
    this.role = this.authService.getRole();
    this.studentId = this.authService.getStudentId();

    console.log(`HomeComponent: Sesión iniciada para ${this.username}. Rol: ${this.role}`);

    this.syncProfileFromApi();

    if (this.role === 'alumno') {
      this.loadStudentData();
    } else {
      this.loadTeacherData();
    }

    // Suscribirse a cambios de sesión para actualizar dinámicamente
    this.authSub = this.authService.authState$.subscribe(s => {
      if (s.username !== this.username || s.role !== this.role) {
        this.username = s.username;
        this.role = s.role;
        this.studentId = this.authService.getStudentId();
        if (this.role === 'alumno') {
          this.loadStudentData();
        } else {
          this.loadTeacherData();
        }
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  syncProfileFromApi() {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      console.warn('HomeComponent: No hay token disponible para consultar el perfil.');
      return;
    }

    console.log('HomeComponent: Consultando endpoint de perfil para cachear datos en localStorage...');
    this.studentService.getExternalProfile(token).subscribe({
      next: (res) => {
        console.log('HomeComponent: Respuesta del perfil recibida:', res);
        const user = res?.usuario;
        if (!user) {
          console.warn('HomeComponent: El perfil no contiene la propiedad usuario.');
          return;
        }

        console.log('HomeComponent: usuario del perfil:', user);
        console.log('HomeComponent: idCurso detectado en perfil:', user.idCurso);
        this.authService.saveExternalProfileData(user);

        if (user.idCurso) {
          this.authService.setCourseId(Number(user.idCurso));
        }
      },
      error: (err) => {
        console.error('HomeComponent: Error consultando el perfil externo:', err);
      }
    });
  }

  // ==========================================
  // ALUMNO LOGIC
  // ==========================================
  loadStudentData() {
    this.loading = true;
    
    // Cargar faltas
    this.studentService.getAbsences(this.studentId).subscribe({
      next: (abs) => {
        this.absences = abs;
        this.absencesCount = abs.length;
        this.recalculatePercentage();
        this.generateCalendar();
      },
      error: (err) => console.error('Error al cargar faltas:', err)
    });

    // Cargar registros e incidentes
    this.studentService.getLogs(this.studentId).subscribe({
      next: (logs) => {
        this.attendanceLogs = logs;
        
        // Extraer retrasos
        this.delays = logs.filter(l => l.type.toLowerCase() === 'retraso');
        this.delaysCount = this.delays.length;
        this.recalculatePercentage();
        this.generateCalendar();
      },
      error: (err) => console.error('Error al cargar registros:', err),
      complete: () => { this.loading = false; }
    });

    // Cargar PC asignado del alumno
    this.loadMiPcAsignado();
  }

  recalculatePercentage() {
    const totalDays = 60; // Simulación de total de días cursados
    const missed = this.absencesCount + (this.delaysCount * 0.25); // Los retrasos descuentan un cuarto de falta
    const pct = ((totalDays - missed) / totalDays) * 100;
    this.attendancePercentage = parseFloat(Math.max(0, Math.min(100, pct)).toFixed(1));
  }

  generateCalendar() {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Día de la semana en que inicia
    // Ajustar para que Lunes sea el primer día de la semana (0: Lunes, 6: Domingo)
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: any[] = [];
    
    // Rellenar días vacíos antes del inicio del mes
    for (let i = 0; i < adjustedStart; i++) {
      days.push({ dayNumber: null, status: 'empty' });
    }

    // Rellenar días del mes
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      
      // Buscar falta en este día
      const hasAbsence = this.absences.some(a => {
        const dDate = new Date(a.date);
        return dDate.getDate() === d && dDate.getMonth() === month && dDate.getFullYear() === year;
      });

      // Buscar retraso en este día
      const hasDelay = this.delays.some(de => {
        const deDate = new Date(de.date);
        return deDate.getDate() === d && deDate.getMonth() === month && deDate.getFullYear() === year;
      });

      let status = 'present';
      if (hasAbsence) {
        status = 'absence';
      } else if (hasDelay) {
        status = 'delay';
      }

      days.push({
        dayNumber: d,
        status: status
      });
    }

    this.calendarDays = days;
  }

  prevMonth() {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  nextMonth() {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  // ==========================================
  // PROFESOR LOGIC
  // ==========================================
  loadTeacherData() {
    this.loading = true;

    // Cargar ronda actual de hoy
    this.http.get<any>('/api/attendance/ronda-actual').subscribe({
      next: (ronda) => {
        this.rondaActual = ronda;
        if (ronda) {
          this.rondaTipo = ronda.tipoClase;
          this.rondaPermitirCambioPC = ronda.permitirCambioPC;
        }
      },
      error: (err) => console.error('Error al cargar ronda actual:', err)
    });

    // Cargar historial de rondas
    this.http.get<any[]>('/api/attendance/rondas').subscribe({
      next: (hist) => {
        this.rondasHistorial = hist;
      },
      error: (err) => console.error('Error al cargar historial de rondas:', err)
    });

    // Cargar lista de equipos
    this.loadEquipos();
  }

  loadEquipos() {
    this.http.get<any[]>('/api/attendance/equipos').subscribe({
      next: (eqs) => {
        this.equipos = eqs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar equipos:', err);
        this.loading = false;
      }
    });
  }

  abrirRonda() {
    const courseId = this.authService.getCourseId();
    console.log('HomeComponent: Abriendo ronda con courseId desde storage:', courseId);

    this.http.post<any>('/api/attendance/rondas/abrir', {
      tipoClase: this.rondaTipo,
      cursoId: courseId,
      permitirCambioPC: this.rondaPermitirCambioPC
    }).subscribe({
      next: (res) => {
        console.log('Ronda abierta/actualizada con éxito:', res);
        this.rondaActual = res.data;
        this.loadTeacherData(); // Recargar historial
      },
      error: (err) => {
        console.error('Error al abrir ronda:', err);
        alert('Error al abrir ronda: ' + (err.error?.message || err.message));
      }
    });
  }

  // ==========================================
  // CRUD EQUIPOS (WHITELIST)
  // ==========================================
  nuevoEquipo() {
    this.editingEquipo = null;
    this.equipoForm = {
      id: '',
      nombreDispositivo: '',
      direccionIP: '127.0.0.1',
      activo: true
    };
    this.mostrarModalEquipo = true;
  }

  editarEquipo(eq: any) {
    this.editingEquipo = eq;
    this.equipoForm = {
      id: eq.id,
      nombreDispositivo: eq.nombreDispositivo,
      direccionIP: eq.direccionIP,
      activo: eq.activo
    };
    this.mostrarModalEquipo = true;
  }

  guardarEquipo() {
    if (!this.equipoForm.nombreDispositivo.trim() || !this.equipoForm.direccionIP.trim()) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    if (this.editingEquipo) {
      // Modificar
      this.http.put<any>(`/api/attendance/equipos/${this.equipoForm.id}`, this.equipoForm).subscribe({
        next: () => {
          this.mostrarModalEquipo = false;
          this.loadEquipos();
        },
        error: (err) => alert('Error al editar equipo: ' + (err.error?.message || err.message))
      });
    } else {
      // Crear
      const { id, ...nuevo } = this.equipoForm;
      this.http.post<any>('/api/attendance/equipos', nuevo).subscribe({
        next: () => {
          this.mostrarModalEquipo = false;
          this.loadEquipos();
        },
        error: (err) => alert('Error al registrar equipo: ' + (err.error?.message || err.message))
      });
    }
  }

  eliminarEquipo(id: string) {
    if (confirm('¿Estás seguro de eliminar este dispositivo de la lista blanca?')) {
      this.http.delete(`/api/attendance/equipos/${id}`).subscribe({
        next: () => this.loadEquipos(),
        error: (err) => alert('Error al eliminar equipo: ' + err.message)
      });
    }
  }

  // ==========================================
  // REGISTRO MANUAL DE ASISTENCIA (ROLL CALL)
  // ==========================================
  nuevoRegistroManual() {
    this.manualForm = {
      studentId: this.estudiantesList[0].id,
      type: 'Falta',
      subject: 'Programación .NET Core',
      time: '08:30',
      date: new Date().toISOString().split('T')[0],
      minutes: 15,
      text: 'Pase de lista manual'
    };
    this.mostrarModalManual = true;
  }

  guardarRegistroManual() {
    if (this.manualForm.type === 'Falta') {
      const payload = {
        studentId: this.manualForm.studentId,
        subject: this.manualForm.subject,
        date: new Date(this.manualForm.date),
        time: this.manualForm.time
      };
      this.http.post('/api/attendance/absence', payload).subscribe({
        next: () => {
          this.mostrarModalManual = false;
          alert('Falta registrada con éxito.');
        },
        error: (err) => alert('Error al registrar falta: ' + err.message)
      });
    } else {
      const payload = {
        studentId: this.manualForm.studentId,
        type: 'Retraso',
        subject: this.manualForm.subject,
        date: new Date(this.manualForm.date),
        time: this.manualForm.time,
        minutes: this.manualForm.minutes,
        text: `${this.manualForm.minutes} min de retraso. ${this.manualForm.text}`
      };
      this.http.post('/api/attendance/log', payload).subscribe({
        next: () => {
          this.mostrarModalManual = false;
          alert('Retraso registrado con éxito.');
        },
        error: (err) => alert('Error al registrar retraso: ' + err.message)
      });
    }
  }

  loadMiPcAsignado() {
    this.http.get<any[]>('/api/attendance/equipos').subscribe({
      next: (eqs) => {
        this.miPcAsignado = eqs.find(e => e.studentId === this.studentId) || null;
        if (this.miPcAsignado) {
          this.miPcForm.nombre = this.miPcAsignado.nombreDispositivo;
          this.miPcForm.ip = this.miPcAsignado.direccionIP;
        }
      },
      error: (err) => console.error('Error al cargar mi PC:', err)
    });
  }

  abrirModalVincularPc() {
    this.mostrarModalVincularPc = true;
    this.http.get<any>('/api/attendance/equipos/detectar-conexion').subscribe({
      next: (res) => {
        if (res && res.success) {
          this.miPcForm.nombre = res.hostname || this.miPcForm.nombre;
          this.miPcForm.ip = res.ip || this.miPcForm.ip;
        }
      },
      error: (err) => {
        console.error('Error al detectar conexión automática:', err);
      }
    });
  }

  registrarMiPc() {
    if (!this.miPcForm.nombre.trim() || !this.miPcForm.ip.trim()) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    this.http.post<any>('/api/attendance/equipos/registrar-alumno', {
      studentId: this.studentId,
      nombreDispositivo: this.miPcForm.nombre.trim(),
      direccionIP: this.miPcForm.ip.trim()
    }).subscribe({
      next: (res) => {
        alert(res.message);
        this.mostrarModalVincularPc = false;
        this.loadStudentData(); // Recargar datos del alumno
      },
      error: (err) => {
        alert('Error al registrar PC: ' + (err.error?.message || err.message));
      }
    });
  }

  // ==========================================
  // GENERAL
  // ==========================================
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
