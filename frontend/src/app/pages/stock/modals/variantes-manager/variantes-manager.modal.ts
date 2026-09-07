import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ProductoService } from '../../../../core/services/producto.service';
import { VarianteProducto } from '../../../../models/producto.model';

@Component({
  selector: 'app-variantes-manager',
  standalone: true,
  imports: [
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './variantes-manager.modal.html',
})
export class VariantesManagerModal implements OnInit {
  @Input() productoId!: number;
  @Input() productoNombre = '';

  variantes: VarianteProducto[] = [];

  nuevoTalle = '';
  nuevoColor = '';
  nuevoSku = '';
  nuevoStockInicial = 0;

  cargando = signal(false);
  error = signal<string | null>(null);
  huboCambios = false;

  constructor(
    private modalCtrl: ModalController,
    private productoSvc: ProductoService,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.productoSvc.obtener(this.productoId).subscribe({
      next: (detalle) => {
        this.variantes = detalle.variantes;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cerrar() {
    this.modalCtrl.dismiss({ huboCambios: this.huboCambios }, 'cancel');
  }

  etiqueta(v: VarianteProducto): string {
    if (!v.talle && !v.color) {
      return 'General';
    }
    return [v.talle, v.color].filter(Boolean).join(' / ');
  }

  badgeColor(v: VarianteProducto): string {
    if (v.stock_actual === 0) return 'danger';
    if (v.stock_actual <= v.stock_minimo) return 'warning';
    return 'success';
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

  async ajustarStock(v: VarianteProducto) {
    const alert = await this.alertCtrl.create({
      header: `Ajustar stock — ${this.etiqueta(v)}`,
      inputs: [
        { name: 'nuevoStock', type: 'number', value: v.stock_actual, placeholder: 'Nuevo stock' },
        { name: 'motivo', type: 'text', placeholder: 'Motivo (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoStock = Number(data.nuevoStock);
            if (Number.isNaN(nuevoStock) || nuevoStock < 0) return false;
            this.productoSvc.ajustarStock(this.productoId, v.id, nuevoStock, data.motivo || undefined).subscribe(() => {
              this.huboCambios = true;
              this.cargar();
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async editarMinimo(v: VarianteProducto) {
    const alert = await this.alertCtrl.create({
      header: `Stock mínimo — ${this.etiqueta(v)}`,
      inputs: [{ name: 'stockMinimo', type: 'number', value: v.stock_minimo }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const stockMinimo = Number(data.stockMinimo);
            if (Number.isNaN(stockMinimo) || stockMinimo < 0) return false;
            this.productoSvc
              .actualizarVariante(this.productoId, v.id, {
                talle: v.talle ?? undefined,
                color: v.color ?? undefined,
                sku: v.sku ?? undefined,
                codigo_barras: v.codigo_barras ?? undefined,
                stock_minimo: stockMinimo,
              })
              .subscribe(() => {
                this.huboCambios = true;
                this.cargar();
              });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async eliminar(v: VarianteProducto) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar variante',
      message: `¿Eliminar la variante "${this.etiqueta(v)}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.productoSvc.eliminarVariante(this.productoId, v.id).subscribe(() => {
              this.huboCambios = true;
              this.cargar();
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
