import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { Proveedor } from '../../../../models/proveedor.model';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './proveedor-form.modal.html',
})
export class ProveedorFormModal implements OnInit {
  @Input() proveedor: Proveedor | null = null;

  nombre = '';
  telefono = '';
  email = '';
  direccion = '';
  cuit = '';
  notas = '';

  guardando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private modalCtrl: ModalController,
    private proveedorSvc: ProveedorService,
  ) {}

  get esEdicion(): boolean {
    return !!this.proveedor;
  }

  ngOnInit() {
    if (this.proveedor) {
      this.nombre = this.proveedor.nombre;
      this.telefono = this.proveedor.telefono ?? '';
      this.email = this.proveedor.email ?? '';
      this.direccion = this.proveedor.direccion ?? '';
      this.cuit = this.proveedor.cuit ?? '';
      this.notas = this.proveedor.notas ?? '';
    }
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  guardar() {
    if (!this.nombre.trim()) {
      this.error.set('El nombre es obligatorio');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const datos = {
      nombre: this.nombre.trim(),
      telefono: this.telefono.trim() || undefined,
      email: this.email.trim() || undefined,
      direccion: this.direccion.trim() || undefined,
      cuit: this.cuit.trim() || undefined,
      notas: this.notas.trim() || undefined,
    };

    const operacion = this.proveedor
      ? this.proveedorSvc.actualizar(this.proveedor.id, { ...datos, activo: true })
      : this.proveedorSvc.crear(datos);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalCtrl.dismiss({ guardado: true }, 'confirm');
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.detail ?? 'No se pudo guardar');
      },
    });
  }
}
