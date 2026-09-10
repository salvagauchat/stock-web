import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { Categoria } from '../../../../models/categoria.model';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './categoria-form.modal.html',
})
export class CategoriaFormModal implements OnInit {
  @Input() categoria: Categoria | null = null;

  nombre = '';
  descripcion = '';
  icono = '';

  guardando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private modalCtrl: ModalController,
    private categoriaSvc: CategoriaService,
  ) {}

  get esEdicion(): boolean {
    return !!this.categoria;
  }

  ngOnInit() {
    if (this.categoria) {
      this.nombre = this.categoria.nombre;
      this.descripcion = this.categoria.descripcion ?? '';
      this.icono = this.categoria.icono ?? '';
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
      descripcion: this.descripcion.trim() || undefined,
      icono: this.icono.trim() || undefined,
    };

    const operacion = this.categoria
      ? this.categoriaSvc.actualizar(this.categoria.id, { ...datos, activo: true })
      : this.categoriaSvc.crear(datos);

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
