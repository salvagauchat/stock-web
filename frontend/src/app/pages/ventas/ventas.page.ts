import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { VentaService } from '../../core/services/venta.service';
import { Categoria } from '../../models/categoria.model';
import { Producto } from '../../models/producto.model';
import { PagoCreate, VentaCreate } from '../../models/venta.model';
import { colorCategoria, etiquetaVariante, inicial } from '../../shared/presentacion';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
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

const TAMANO_PAGINA = 30;

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [FormsModule, MoneyPipe],
  templateUrl: './ventas.page.html',
  styleUrl: './ventas.page.scss',
})
export class VentasPage implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  busqueda = '';
  categoriaFiltro = signal<number | null>(null);
  carrito: ItemCarrito[] = [];
  cargando = signal(false);
  procesando = signal(false);
  carritoAbierto = signal(false);
  limite = signal(TAMANO_PAGINA);

  constructor(
    private productoSvc: ProductoService,
    private categoriaSvc: CategoriaService,
    private ventaSvc: VentaService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private router: Router,
  ) {}

  ngOnInit() {
    this.categoriaSvc.listar().subscribe((categorias) => (this.categorias = categorias));
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
    const categoriaId = this.categoriaFiltro();
    this.productosFiltrados = this.productos.filter((p) => {
      const matchTexto =
        !termino || p.id.toString() === termino || [p.nombre, p.marca].some((campo) => campo?.toLowerCase().includes(termino));
      const matchCategoria = categoriaId === null || p.categoria_id === categoriaId;
      return matchTexto && matchCategoria;
    });
    this.limite.set(TAMANO_PAGINA);
  }

  get productosVisibles(): Producto[] {
    return this.productosFiltrados.slice(0, this.limite());
  }

  mostrarMas() {
    this.limite.update((l) => l + TAMANO_PAGINA);
  }

  seleccionarCategoria(id: number | null) {
    this.categoriaFiltro.set(id);
    this.aplicarFiltro();
  }

  readonly colorCategoria = colorCategoria;
  readonly inicial = inicial;

  irAHistorial() {
    this.router.navigateByUrl('/historial');
  }

  get subtotal(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
  }

  totalUnidades(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  abrirCarrito() {
    this.carritoAbierto.set(true);
  }

  cerrarCarrito() {
    this.carritoAbierto.set(false);
  }

  readonly etiqueta = etiquetaVariante;

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
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--variante'],
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
      this.carritoAbierto.set(true);
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
    this.carritoAbierto.set(true);
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

  vaciarCarrito() {
    this.carrito = [];
    this.carritoAbierto.set(false);
  }

  async cobrar() {
    if (this.carrito.length === 0) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: PagoModal,
      componentProps: { subtotal: this.subtotal },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--cobro'],
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
        this.carritoAbierto.set(false);
        this.cargar();
        const modal = await this.modalCtrl.create({
          component: ComprobanteModal,
          componentProps: { venta },
          cssClass: ['sl-dialog-modal', 'sl-dialog-modal--comprobante'],
        });
        await modal.present();
      },
      error: (err) => {
        this.procesando.set(false);
        this.mostrarToast(err.error?.detail ?? 'No se pudo registrar la venta', 'danger');
      },
    });
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color });
    await toast.present();
  }
}
