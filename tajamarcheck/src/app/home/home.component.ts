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

  mostrarModalJustificar = false;
  justificacionForm = {
    idAsistencia: 0,
    texto: ''
  };

  mostrarModalRondaRegistro = false;
  mostrarModalRondaCambioSitio = false;
  mostrarModalMapaSitios = false;
  
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
  estudiantesEstado: any[] = [];
  
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

  // Toast Notification State
  toast = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning' | 'info'
  };
  private toastTimeout: any;

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toast = { show: true, message, type };
    this.toastTimeout = setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

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
      const currentStudentId = this.authService.getStudentId();
      if (s.username !== this.username || s.role !== this.role || currentStudentId !== this.studentId) {
        this.username = s.username;
        this.role = s.role;
        this.studentId = currentStudentId;
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
    const missed = this.absencesCount + Math.floor(this.delaysCount / 2);
    const pct = ((totalDays - missed) / totalDays) * 100;
    this.attendancePercentage = parseFloat(Math.max(0, Math.min(100, pct)).toFixed(1));
  }

  matchDate(dateStr: any, d: number, month: number, year: number): boolean {
    if (!dateStr) return false;
    try {
      const dateOnly = dateStr.toString().split('T')[0];
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return y === year && m === month && day === d;
      }
    } catch (e) {}
    const dDate = new Date(dateStr);
    return dDate.getDate() === d && dDate.getMonth() === month && dDate.getFullYear() === year;
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
      // Buscar falta en este día
      const hasAbsence = this.absences.some(a => this.matchDate(a.date, d, month, year));

      // Buscar retraso en este día
      const hasDelay = this.delays.some(de => this.matchDate(de.date, d, month, year));

      // Buscar presente en este día
      const hasPresent = this.attendanceLogs.some(l => 
        l.type.toLowerCase() === 'entrada' && this.matchDate(l.date, d, month, year)
      );

      let status = 'nodata';
      if (hasAbsence) {
        status = 'absence';
      } else if (hasDelay) {
        status = 'delay';
      } else if (hasPresent) {
        status = 'present';
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
          this.cargarEstadoAlumnosDiario();
        } else {
          this.estudiantesEstado = [];
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

  abrirRondaRegistro() {
    this.mostrarModalRondaRegistro = true;
  }

  confirmarRondaRegistro() {
    this.mostrarModalRondaRegistro = false;
    this.loading = true;
    const courseId = this.authService.getCourseId();
    this.http.post<any>('/api/attendance/rondas/abrir', {
      tipoClase: 'Presencial',
      cursoId: courseId,
      permitirCambioPC: true,
      eliminarEquipos: true,
      desvincularTodos: false
    }).subscribe({
      next: (res) => {
        console.log('Ronda de registro abierta con éxito (equipos eliminados):', res);
        this.rondaActual = res.data;
        this.loadTeacherData();
        this.showToast('Ronda de registro abierta y lista de equipos eliminada.', 'success');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al abrir ronda de registro:', err);
        this.showToast('Error al abrir ronda de registro: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  abrirRondaCambioSitio() {
    this.mostrarModalRondaCambioSitio = true;
  }

  confirmarRondaCambioSitio() {
    this.mostrarModalRondaCambioSitio = false;
    this.loading = true;
    const courseId = this.authService.getCourseId();
    this.http.post<any>('/api/attendance/rondas/abrir', {
      tipoClase: 'Presencial',
      cursoId: courseId,
      permitirCambioPC: true,
      eliminarEquipos: false,
      desvincularTodos: true
    }).subscribe({
      next: (res) => {
        console.log('Ronda de cambio de sitio abierta con éxito:', res);
        this.rondaActual = res.data;
        this.loadTeacherData();
        this.showToast('Ronda de cambio de sitio abierta con éxito (usuarios desvinculados).', 'success');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al abrir ronda de cambio de sitio:', err);
        this.showToast('Error al abrir ronda de cambio de sitio: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  getNombreEstudiante(studentId: number | null | undefined): string {
    if (!studentId) return 'Libre';
    const est = this.estudiantesList.find(e => e.id === studentId);
    return est ? est.name : `Estudiante #${studentId}`;
  }

  desvincularPcProfesor(eq: any) {
    const payload = {
      id: eq.id,
      nombreDispositivo: eq.nombreDispositivo,
      direccionIP: eq.direccionIP,
      studentId: null
    };
    this.http.put<any>(`/api/attendance/equipos/${eq.id}`, payload).subscribe({
      next: () => {
        this.showToast('Estudiante desvinculado del equipo.', 'success');
        this.loadEquipos(); // Recargar mapa
      },
      error: (err) => {
        this.showToast('Error al desvincular estudiante: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  abrirSesionFichaje() {
    this.loading = true;
    const courseId = this.authService.getCourseId();
    this.http.post<any>('/api/attendance/rondas/abrir', {
      tipoClase: this.rondaTipo,
      cursoId: courseId,
      permitirCambioPC: false,
      desvincularTodos: false
    }).subscribe({
      next: (res) => {
        console.log('Sesión de fichaje abierta con éxito:', res);
        this.rondaActual = res.data;
        this.loadTeacherData();
        this.showToast('Sesión de fichaje abierta con éxito.', 'success');
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al abrir sesión de fichaje:', err);
        this.showToast('Error al abrir sesión de fichaje: ' + (err.error?.message || err.message), 'error');
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
      this.showToast('Todos los campos son obligatorios.', 'warning');
      return;
    }

    if (this.editingEquipo) {
      // Modificar
      this.http.put<any>(`/api/attendance/equipos/${this.equipoForm.id}`, this.equipoForm).subscribe({
        next: () => {
          this.mostrarModalEquipo = false;
          this.loadEquipos();
          this.showToast('Dispositivo modificado con éxito.', 'success');
        },
        error: (err) => this.showToast('Error al editar equipo: ' + (err.error?.message || err.message), 'error')
      });
    } else {
      // Crear
      const { id, ...nuevo } = this.equipoForm;
      this.http.post<any>('/api/attendance/equipos', nuevo).subscribe({
        next: () => {
          this.mostrarModalEquipo = false;
          this.loadEquipos();
          this.showToast('Dispositivo registrado con éxito.', 'success');
        },
        error: (err) => this.showToast('Error al registrar equipo: ' + (err.error?.message || err.message), 'error')
      });
    }
  }

  eliminarEquipo(id: string) {
    if (confirm('¿Estás seguro de eliminar este dispositivo de la lista blanca?')) {
      this.http.delete(`/api/attendance/equipos/${id}`).subscribe({
        next: () => {
          this.loadEquipos();
          this.showToast('Dispositivo eliminado con éxito.', 'success');
        },
        error: (err) => this.showToast('Error al eliminar equipo: ' + err.message, 'error')
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
    if (!this.rondaActual) {
      this.showToast("No hay ninguna ronda activa para el día de hoy. Abre una ronda antes de registrar asistencia manual.", "warning");
      return;
    }

    const typeMapped = this.manualForm.type; // 'Falta' o 'Retraso' o 'Presente'
    const payload = {
      studentId: this.manualForm.studentId,
      sessionId: this.rondaActual.id,
      type: typeMapped,
      minutes: typeMapped === 'Retraso' ? this.manualForm.minutes : undefined,
      text: typeMapped === 'Retraso' 
        ? `${this.manualForm.minutes} min de retraso. ${this.manualForm.text}` 
        : (this.manualForm.text || 'Pase de lista manual')
    };

    this.studentService.registrarAsistenciaManual(payload).subscribe({
      next: () => {
        this.mostrarModalManual = false;
        this.showToast(`${typeMapped} registrado con éxito.`, 'success');
        this.cargarEstadoAlumnosDiario();
      },
      error: (err) => this.showToast('Error al registrar asistencia: ' + (err.error?.message || err.message), 'error')
    });
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
    if (this.miPcAsignado) {
      this.showToast('Ya tienes un PC asignado. No se permite cambiar el PC.', 'warning');
      return;
    }
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
      this.showToast('Todos los campos son obligatorios.', 'warning');
      return;
    }
    this.http.post<any>('/api/attendance/equipos/registrar-alumno', {
      studentId: this.studentId,
      nombreDispositivo: this.miPcForm.nombre.trim(),
      direccionIP: this.miPcForm.ip.trim()
    }).subscribe({
      next: (res) => {
        this.showToast(res.message, 'success');
        this.mostrarModalVincularPc = false;
        this.loadStudentData(); // Recargar datos del alumno
      },
      error: (err) => {
        this.showToast('Error al registrar PC: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  cargarEstadoAlumnosDiario() {
    this.studentService.getDiario().subscribe({
      next: (res) => {
        const processedIds = new Set<number>();
        const estados = this.estudiantesList.map(est => {
          processedIds.add(est.id);
          const studentLogs = res.logs.filter((l: any) => l.studentId === est.id);
          const studentAbsence = res.absences.find((a: any) => a.studentId === est.id);

          let estado = 'Sin Registrar';
          let detalle = '';

          if (studentAbsence) {
            estado = 'Falta';
            detalle = `Falta registrada a las ${studentAbsence.time}`;
          } else if (studentLogs.length > 0) {
            const tieneEntrada = studentLogs.some((l: any) => l.type === 'Entrada');
            const tieneSalida = studentLogs.some((l: any) => l.type === 'Salida');
            const retraso = studentLogs.find((l: any) => l.type === 'Retraso');

            if (retraso) {
              estado = 'Retraso';
              detalle = `Retraso de ${retraso.minutes} min a las ${retraso.time}`;
            } else if (tieneEntrada && tieneSalida) {
              estado = 'Fichado (Completo)';
              detalle = `Entrada y Salida registradas`;
            } else if (tieneEntrada) {
              estado = 'Fichado (Entrada)';
              detalle = `Entrada registrada a las ${studentLogs.find((l: any) => l.type === 'Entrada').time}`;
            } else if (tieneSalida) {
              estado = 'Fichado (Salida)';
              detalle = `Salida registrada a las ${studentLogs.find((l: any) => l.type === 'Salida').time}`;
            }
          }

          return {
            ...est,
            estado,
            detalle,
            logs: studentLogs,
            absence: studentAbsence
          };
        });

        // Dynamic student loading from daily logs/absences
        const allLogs = [...(res.logs || []), ...(res.absences || [])];
        allLogs.forEach((item: any) => {
          const sId = Number(item.studentId);
          if (!processedIds.has(sId)) {
            processedIds.add(sId);

            const studentLogs = res.logs.filter((l: any) => Number(l.studentId) === sId);
            const studentAbsence = res.absences.find((a: any) => Number(a.studentId) === sId);

            const name = item.studentName || `Estudiante #${sId}`;

            let estado = 'Sin Registrar';
            let detalle = '';

            if (studentAbsence) {
              estado = 'Falta';
              detalle = `Falta registrada a las ${studentAbsence.time}`;
            } else if (studentLogs.length > 0) {
              const tieneEntrada = studentLogs.some((l: any) => l.type === 'Entrada');
              const tieneSalida = studentLogs.some((l: any) => l.type === 'Salida');
              const retraso = studentLogs.find((l: any) => l.type === 'Retraso');

              if (retraso) {
                estado = 'Retraso';
                detalle = `Retraso de ${retraso.minutes} min a las ${retraso.time}`;
              } else if (tieneEntrada && tieneSalida) {
                estado = 'Fichado (Completo)';
                detalle = `Entrada y Salida registradas`;
              } else if (tieneEntrada) {
                estado = 'Fichado (Entrada)';
                detalle = `Entrada registrada a las ${studentLogs.find((l: any) => l.type === 'Entrada').time}`;
              } else if (tieneSalida) {
                estado = 'Fichado (Salida)';
                detalle = `Salida registrada a las ${studentLogs.find((l: any) => l.type === 'Salida').time}`;
              }
            }

            estados.push({
              id: sId,
              name,
              estado,
              detalle,
              logs: studentLogs,
              absence: studentAbsence
            });
          }
        });

        this.estudiantesEstado = estados;
      },
      error: (err) => console.error('Error al cargar estado diario de alumnos:', err)
    });
  }

  ficharManual(studentId: number, type: 'Entrada' | 'Salida') {
    if (!this.rondaActual) return;
    this.loading = true;
    const est = this.estudiantesList.find(e => e.id === studentId);
    const nombreUsuario = est ? est.name : `Estudiante #${studentId}`;
    this.studentService.registrarAsistenciaManual({
      studentId,
      sessionId: this.rondaActual.id,
      type,
      nombreUsuario
    }).subscribe({
      next: (res) => {
        this.showToast(res.mensaje || 'Fichaje manual registrado con éxito.', 'success');
        this.cargarEstadoAlumnosDiario();
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Error al realizar fichaje manual: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  ponerFaltaManual(studentId: number) {
    if (!this.rondaActual) return;
    this.loading = true;
    const est = this.estudiantesList.find(e => e.id === studentId);
    const nombreUsuario = est ? est.name : `Estudiante #${studentId}`;
    this.studentService.registrarAsistenciaManual({
      studentId,
      sessionId: this.rondaActual.id,
      type: 'Falta',
      nombreUsuario
    }).subscribe({
      next: (res) => {
        this.showToast(res.mensaje || 'Falta manual registrada con éxito.', 'success');
        this.cargarEstadoAlumnosDiario();
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Error al registrar falta manual: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  ponerRetrasoManual(studentId: number) {
    if (!this.rondaActual) return;
    const minutesStr = prompt('Introduce los minutos del retraso:', '15');
    if (minutesStr === null) return;
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(minutes) || minutes <= 0) {
      this.showToast('Por favor introduce un número de minutos válido mayor a 0.', 'warning');
      return;
    }

    this.loading = true;
    const est = this.estudiantesList.find(e => e.id === studentId);
    const nombreUsuario = est ? est.name : `Estudiante #${studentId}`;
    this.studentService.registrarAsistenciaManual({
      studentId,
      sessionId: this.rondaActual.id,
      type: 'Retraso',
      minutes: minutes,
      text: `${minutes} min de retraso (Pase manual)`,
      nombreUsuario
    }).subscribe({
      next: (res) => {
        this.showToast(res.mensaje || 'Retraso manual registrado con éxito.', 'success');
        this.cargarEstadoAlumnosDiario();
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Error al registrar retraso manual: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  limpiarRegistroManual(studentId: number) {
    if (!confirm('¿Estás seguro de que deseas borrar los registros de asistencia de hoy para este estudiante?')) {
      return;
    }
    this.loading = true;
    this.studentService.clearDiario(studentId).subscribe({
      next: (res) => {
        this.showToast(res.mensaje || 'Registros de asistencia borrados con éxito.', 'success');
        this.cargarEstadoAlumnosDiario();
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Error al limpiar registros diarios: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  abrirModalJustificar(abs: any) {
    this.justificacionForm.idAsistencia = abs.id;
    this.justificacionForm.texto = abs.justificacion || '';
    this.mostrarModalJustificar = true;
  }

  guardarJustificacion() {
    if (!this.justificacionForm.texto.trim()) {
      this.showToast('Por favor, escribe un texto para justificar la falta.', 'warning');
      return;
    }
    this.studentService.justificarFalta(this.justificacionForm.idAsistencia, this.justificacionForm.texto.trim()).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Justificación enviada correctamente.', 'success');
        this.mostrarModalJustificar = false;
        this.loadStudentData(); // Recargar datos
      },
      error: (err) => {
        this.showToast('Error al justificar falta: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  revisarJustificacion(absenceId: number, aceptar: boolean) {
    this.studentService.revisarJustificacion(absenceId, aceptar).subscribe({
      next: (res) => {
        this.showToast(res.message || (aceptar ? 'Justificación aceptada.' : 'Justificación rechazada.'), 'success');
        this.cargarEstadoAlumnosDiario(); // Recargar datos del profesor
      },
      error: (err) => {
        this.showToast('Error al revisar justificación: ' + (err.error?.message || err.message), 'error');
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
