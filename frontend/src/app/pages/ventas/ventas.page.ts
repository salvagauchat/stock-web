import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { ProductoService } from '../../core/services/producto.service';
import { VentaService } from '../../core/services/venta.service';
import { Producto } from '../../models/producto.model';
import { PagoCreate, VentaCreate } from '../../models/venta.model';
import { ComprobanteModal } from './modals/comprobante/comprobante.modal';
import { PagoModal } from './modals/pago/pago.modal';
import { SeleccionarVarianteModal } from './modals/seleccionar-variante/seleccionar-variante.modal';

interface ItemCarrito {
  productoId: number;
  varianteId: number;
  productoNombre: string;
  etiquetaVariante: string;
  cantidad: number;
  precioUnitario: number;
  stockDisponible: number;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonSearchbar,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './ventas.page.html',
  styleUrl: './ventas.page.scss',
})
export class VentasPage implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busqueda = '';
  carrito: ItemCarrito[] = [];
  cargando = signal(false);
  procesando = signal(false);

  constructor(
    private productoSvc: ProductoService,
    private ventaSvc: VentaService,
    private auth: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.productoSvc.listar(true).subscribe({
      next: (productos) => {
        this.productos = productos.filter((p) => p.stock_total > 0);
        this.aplicarFiltro();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  aplicarFiltro() {
    const termino = this.busqueda.trim().toLowerCase();
    this.productosFiltrados = !termino
      ? this.productos
      : this.productos.filter(
          (p) =>
            p.id.toString() === termino ||
            [p.nombre, p.marca].some((campo) => campo?.toLowerCase().includes(termino)),
        );
  }

  estaEnCarrito(productoId: number): boolean {
    return this.carrito.some((item) => item.productoId === productoId);
  }

  get subtotal(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
  }

  etiqueta(v: { talle: string | null; color: string | null }): string {
    if (!v.talle && !v.color) {
      return 'General';
    }
    return [v.talle, v.color].filter(Boolean).join(' / ');
  }

  async seleccionarProducto(producto: Producto) {
    const detalle = await firstValueFrom(this.productoSvc.obtener(producto.id));
    const variantesConStock = detalle.variantes.filter((v) => v.stock_actual > 0);

    if (variantesConStock.length === 0) {
      await this.mostrarToast('Sin stock disponible', 'warning');
      return;
    }

    if (variantesConStock.length === 1) {
      this.agregarAlCarrito(detalle.id, detalle.nombre, Number(detalle.precio_venta), variantesConStock[0]);
      return;
    }

    const modal = await this.modalCtrl.create({
      component: SeleccionarVarianteModal,
      componentProps: { productoNombre: detalle.nombre, variantes: variantesConStock },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.variante) {
      this.agregarAlCarrito(detalle.id, detalle.nombre, Number(detalle.precio_venta), data.variante);
    }
  }

  private agregarAlCarrito(
    productoId: number,
    productoNombre: string,
    precioUnitario: number,
    variante: { id: number; talle: string | null; color: string | null; stock_actual: number },
  ) {
    const existente = this.carrito.find((i) => i.varianteId === variante.id);
    if (existente) {
      if (existente.cantidad >= existente.stockDisponible) {
        this.mostrarToast('No hay más stock de este producto', 'warning');
        return;
      }
      existente.cantidad++;
      return;
    }

    this.carrito.push({
      productoId,
      varianteId: variante.id,
      productoNombre,
      etiquetaVariante: this.etiqueta(variante),
      cantidad: 1,
      precioUnitario,
      stockDisponible: variante.stock_actual,
    });
  }

  incrementar(item: ItemCarrito) {
    if (item.cantidad < item.stockDisponible) {
      item.cantidad++;
    } else {
      this.mostrarToast('No hay más stock de este producto', 'warning');
    }
  }

  decrementar(item: ItemCarrito) {
    item.cantidad--;
    if (item.cantidad <= 0) {
      this.quitar(item);
    }
  }

  quitar(item: ItemCarrito) {
    this.carrito = this.carrito.filter((i) => i.varianteId !== item.varianteId);
  }

  async cobrar() {
    if (this.carrito.length === 0) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: PagoModal,
      componentProps: { subtotal: this.subtotal },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.confirmarVenta(data.pagos);
    }
  }

  private confirmarVenta(pagos: PagoCreate[]) {
    const datos: VentaCreate = {
      items: this.carrito.map((item) => ({
        variante_id: item.varianteId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      })),
      pagos,
    };

    this.procesando.set(true);
    this.ventaSvc.crear(datos).subscribe({
      next: async (venta) => {
        this.procesando.set(false);
        this.carrito = [];
        this.cargar();
        const modal = await this.modalCtrl.create({ component: ComprobanteModal, componentProps: { venta } });
        await modal.present();
      },
      error: (err) => {
        this.procesando.set(false);
        this.mostrarToast(err.error?.detail ?? 'No se pudo registrar la venta', 'danger');
      },
    });
  }

  logout() {
    this.auth.logout();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color });
    await toast.present();
  }
}
