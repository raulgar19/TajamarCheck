import { Component } from '@angular/core';

@Component({
  selector: 'app-attendance-check',
  standalone: true,
  templateUrl: './attendance-check.component.html',
  styleUrls: ['./attendance-check.component.css']
})
export class AttendanceCheckComponent {
  modo: 'entrada' | 'salida' = 'entrada';
  fichar() {
    // Aquí irá la lógica de fichaje
    alert(`Fichaje de ${this.modo} realizado (simulado)`);
  }
  cambiarModo() {
    this.modo = this.modo === 'entrada' ? 'salida' : 'entrada';
  }
}
