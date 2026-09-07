import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { Categoria } from '../../../../models/categoria.model';
import { ProductoDetalle } from '../../../../models/producto.model';
import { Proveedor } from '../../../../models/proveedor.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './producto-form.modal.html',
})
export class ProductoFormModal implements OnInit {
  @Input() producto: ProductoDetalle | null = null;

  categorias: Categoria[] = [];
  proveedores: Proveedor[] = [];

  nombre = '';
  descripcion = '';
  marca = '';
  categoriaId: number | null = null;
  proveedorId: number | null = null;
  precioCosto = 0;
  precioVenta = 0;
  stock = 0;

  private stockOriginal = 0;
  private varianteId: number | null = null;

  guardando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private modalCtrl: ModalController,
    private productoSvc: ProductoService,
    private categoriaSvc: CategoriaService,
    private proveedorSvc: ProveedorService,
  ) {}

  get esEdicion(): boolean {
    return !!this.producto;
  }

  ngOnInit() {
    this.categoriaSvc.listar().subscribe((cats) => (this.categorias = cats));
    this.proveedorSvc.listar().subscribe((provs) => (this.proveedores = provs));

    if (this.producto) {
      this.nombre = this.producto.nombre;
      this.descripcion = this.producto.descripcion ?? '';
      this.marca = this.producto.marca ?? '';
      this.categoriaId = this.producto.categoria_id;
      this.proveedorId = this.producto.proveedor_id;
      this.precioCosto = Number(this.producto.precio_costo);
      this.precioVenta = Number(this.producto.precio_venta);

      const variante = this.producto.variantes[0];
      if (variante) {
        this.varianteId = variante.id;
        this.stock = variante.stock_actual;
        this.stockOriginal = variante.stock_actual;
      }
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

    const datosBase = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || undefined,
      marca: this.marca.trim() || undefined,
      categoria_id: this.categoriaId,
      proveedor_id: this.proveedorId,
      precio_costo: this.precioCosto,
      precio_venta: this.precioVenta,
    };

    if (this.producto) {
      const productoId = this.producto.id;
      this.productoSvc.actualizar(productoId, datosBase).subscribe({
        next: () => this.ajustarStockSiCambioYcerrar(productoId),
        error: (err) => this.mostrarError(err),
      });
    } else {
      this.productoSvc.crear({ ...datosBase, stock_inicial: this.stock }).subscribe({
        next: () => this.cerrarConExito(),
        error: (err) => this.mostrarError(err),
      });
    }
  }

  private ajustarStockSiCambioYcerrar(productoId: number) {
    if (this.varianteId && this.stock !== this.stockOriginal) {
      this.productoSvc.ajustarStock(productoId, this.varianteId, this.stock, 'Ajuste desde formulario').subscribe({
        next: () => this.cerrarConExito(),
        error: (err) => this.mostrarError(err),
      });
    } else {
      this.cerrarConExito();
    }
  }

  private cerrarConExito() {
    this.guardando.set(false);
    this.modalCtrl.dismiss({ guardado: true }, 'confirm');
  }

  private mostrarError(err: HttpErrorResponse) {
    this.guardando.set(false);
    this.error.set(err.error?.detail ?? 'No se pudo guardar');
  }
}
