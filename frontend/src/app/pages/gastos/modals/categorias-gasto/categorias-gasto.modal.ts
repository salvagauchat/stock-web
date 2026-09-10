import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { GastoService } from '../../../../core/services/gasto.service';
import { CategoriaGasto, TipoGasto } from '../../../../models/gasto.model';
import { ConfirmDialogModal } from '../../../../shared/modals/confirm-dialog/confirm-dialog.modal';

@Component({
  selector: 'app-categorias-gasto',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './categorias-gasto.modal.html',
  styleUrl: './categorias-gasto.modal.scss',
})
export class CategoriasGastoModal implements OnInit {
  @ViewChild('formSection') formSection!: ElementRef<HTMLElement>;

  categorias: CategoriaGasto[] = [];

  editando: CategoriaGasto | null = null;
  nombre = '';
  tipo: TipoGasto = 'CORRIENTE';
  descripcion = '';

  guardando = signal(false);
  error = signal<string | null>(null);
  huboCambios = false;

  constructor(
    private modalCtrl: ModalController,
    private gastoSvc: GastoService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.gastoSvc.listarCategorias(false).subscribe((categorias) => (this.categorias = categorias));
  }

  get categoriasCorrientes(): CategoriaGasto[] {
    return this.categorias.filter((c) => c.tipo === 'CORRIENTE');
  }

  get categoriasNoCorrientes(): CategoriaGasto[] {
    return this.categorias.filter((c) => c.tipo === 'NO_CORRIENTE');
  }

  editar(categoria: CategoriaGasto) {
    this.editando = categoria;
    this.nombre = categoria.nombre;
    this.tipo = categoria.tipo;
    this.descripcion = categoria.descripcion ?? '';
    this.error.set(null);
    this.formSection.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelarEdicion() {
    this.editando = null;
    this.nombre = '';
    this.tipo = 'CORRIENTE';
    this.descripcion = '';
    this.error.set(null);
  }

  guardar() {
    if (!this.nombre.trim()) {
      this.error.set('Ingresá un nombre');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const datos = { nombre: this.nombre.trim(), tipo: this.tipo, descripcion: this.descripcion.trim() || undefined };
    const operacion = this.editando
      ? this.gastoSvc.actualizarCategoria(this.editando.id, { ...datos, activo: this.editando.activo })
      : this.gastoSvc.crearCategoria(datos);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.huboCambios = true;
        this.cancelarEdicion();
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.detail ?? 'No se pudo guardar la categoría');
      },
    });
  }

  reactivar(categoria: CategoriaGasto) {
    this.gastoSvc
      .actualizarCategoria(categoria.id, {
        nombre: categoria.nombre,
        tipo: categoria.tipo,
        descripcion: categoria.descripcion ?? undefined,
        activo: true,
      })
      .subscribe(() => {
        this.huboCambios = true;
        this.cargar();
      });
  }

  async eliminar(categoria: CategoriaGasto) {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Eliminar categoría de gasto',
        mensaje: `¿Eliminar "${categoria.nombre}"? Los gastos que la usan la mantienen como referencia histórica.`,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.gastoSvc.eliminarCategoria(categoria.id).subscribe(() => {
        this.huboCambios = true;
        if (this.editando?.id === categoria.id) {
          this.cancelarEdicion();
        }
        this.cargar();
      });
    }
  }

  cerrar() {
    this.modalCtrl.dismiss({ huboCambios: this.huboCambios });
  }
}
