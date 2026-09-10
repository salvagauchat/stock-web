import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { ProductoService } from '../../../../core/services/producto.service';
import { VarianteProducto } from '../../../../models/producto.model';
import { ConfirmDialogModal } from '../../../../shared/modals/confirm-dialog/confirm-dialog.modal';
import { etiquetaVariante, swatchColor } from '../../../../shared/presentacion';

interface FilaVariante {
  variante: VarianteProducto;
  stockInput: number;
  motivo: string;
  minimoInput: number;
}

@Component({
  selector: 'app-variantes-manager',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './variantes-manager.modal.html',
  styleUrl: './variantes-manager.modal.scss',
})
export class VariantesManagerModal implements OnInit {
  @Input() productoId!: number;
  @Input() productoNombre = '';

  filas: FilaVariante[] = [];

  nuevoTalle = '';
  nuevoColor = '';
  nuevoSku = '';
  nuevoStockInicial = 0;

  cargando = signal(false);
  error = signal<string | null>(null);
  huboCambios = false;

  readonly etiqueta = etiquetaVariante;
  readonly swatch = swatchColor;

  constructor(
    private modalCtrl: ModalController,
    private productoSvc: ProductoService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.productoSvc.obtener(this.productoId).subscribe({
      next: (detalle) => {
        this.filas = detalle.variantes.map((variante) => ({
          variante,
          stockInput: variante.stock_actual,
          motivo: '',
          minimoInput: variante.stock_minimo,
        }));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cerrar() {
    this.modalCtrl.dismiss({ huboCambios: this.huboCambios }, 'cancel');
  }

  agregar() {
    if (!this.nuevoTalle.trim() && !this.nuevoColor.trim()) {
      this.error.set('Cargá al menos un talle o un color');
      return;
    }

    this.error.set(null);
    this.productoSvc
      .crearVariante(this.productoId, {
        talle: this.nuevoTalle.trim() || undefined,
        color: this.nuevoColor.trim() || undefined,
        sku: this.nuevoSku.trim() || undefined,
        stock_minimo: 0,
        stock_inicial: this.nuevoStockInicial || 0,
      })
      .subscribe({
        next: () => {
          this.huboCambios = true;
          this.nuevoTalle = '';
          this.nuevoColor = '';
          this.nuevoSku = '';
          this.nuevoStockInicial = 0;
          this.cargar();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.detail ?? 'No se pudo agregar la variante');
        },
      });
  }

  guardarStock(fila: FilaVariante) {
    if (fila.stockInput === fila.variante.stock_actual) {
      return;
    }
    this.productoSvc.ajustarStock(this.productoId, fila.variante.id, fila.stockInput, fila.motivo.trim() || undefined).subscribe({
      next: () => {
        this.huboCambios = true;
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.detail ?? 'No se pudo ajustar el stock');
      },
    });
  }

  guardarMinimo(fila: FilaVariante) {
    if (fila.minimoInput === fila.variante.stock_minimo) {
      return;
    }
    const v = fila.variante;
    this.productoSvc
      .actualizarVariante(this.productoId, v.id, {
        talle: v.talle ?? undefined,
        color: v.color ?? undefined,
        sku: v.sku ?? undefined,
        codigo_barras: v.codigo_barras ?? undefined,
        stock_minimo: fila.minimoInput,
      })
      .subscribe({
        next: () => {
          this.huboCambios = true;
          this.cargar();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.detail ?? 'No se pudo actualizar el mínimo');
        },
      });
  }

  async eliminar(fila: FilaVariante) {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Eliminar variante',
        mensaje: `¿Eliminar la variante "${this.etiqueta(fila.variante)}"?`,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.productoSvc.eliminarVariante(this.productoId, fila.variante.id).subscribe(() => {
        this.huboCambios = true;
        this.cargar();
      });
    }
  }
}
