import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { Categoria } from '../../models/categoria.model';
import { Producto, ProductoDetalle } from '../../models/producto.model';
import { ConfirmDialogModal } from '../../shared/modals/confirm-dialog/confirm-dialog.modal';
import { colorCategoria, etiquetaVariante, inicial } from '../../shared/presentacion';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ProductoFormModal } from './modals/producto-form/producto-form.modal';
import { VariantesManagerModal } from './modals/variantes-manager/variantes-manager.modal';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [FormsModule, MoneyPipe],
  templateUrl: './stock.page.html',
  styleUrl: './stock.page.scss',
})
export class StockPage implements OnInit {
  productos: ProductoDetalle[] = [];
  productosFiltrados: ProductoDetalle[] = [];
  categorias: Categoria[] = [];
  busqueda = '';
  categoriaFiltro: number | null = null;
  soloStockBajo = false;
  cargando = signal(false);

  readonly colorCategoria = colorCategoria;
  readonly inicial = inicial;
  readonly etiqueta = etiquetaVariante;

  constructor(
    private productoSvc: ProductoService,
    private categoriaSvc: CategoriaService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.categoriaSvc.listar().subscribe((categorias) => (this.categorias = categorias));
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.productoSvc.listar(true).subscribe({
      next: (productos) => this.cargarDetalles(productos),
      error: () => this.cargando.set(false),
    });
  }

  private cargarDetalles(productos: Producto[]) {
    if (productos.length === 0) {
      this.productos = [];
      this.aplicarFiltro();
      this.cargando.set(false);
      return;
    }
    forkJoin(productos.map((p) => this.productoSvc.obtener(p.id))).subscribe({
      next: (detalles) => {
        this.productos = detalles;
        this.aplicarFiltro();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  aplicarFiltro() {
    const termino = this.busqueda.trim().toLowerCase();
    this.productosFiltrados = this.productos.filter((p) => {
      const matchTexto =
        !termino || p.id.toString() === termino || [p.nombre, p.marca].some((campo) => campo?.toLowerCase().includes(termino));
      const matchCategoria = this.categoriaFiltro === null || p.categoria_id === this.categoriaFiltro;
      const matchStockBajo = !this.soloStockBajo || this.productoTieneStockBajo(p);
      return matchTexto && matchCategoria && matchStockBajo;
    });
  }

  toggleStockBajo() {
    this.soloStockBajo = !this.soloStockBajo;
    this.aplicarFiltro();
  }

  productoTieneStockBajo(p: ProductoDetalle): boolean {
    return p.variantes.some((v) => v.stock_actual <= v.stock_minimo);
  }

  margen(p: ProductoDetalle): number {
    const venta = Number(p.precio_venta);
    if (!venta) {
      return 0;
    }
    return Math.round(((venta - Number(p.precio_costo)) / venta) * 100);
  }

  get kpiArticulos(): number {
    return this.productos.length;
  }

  get kpiVariantes(): number {
    return this.productos.reduce((acc, p) => acc + p.variantes.length, 0);
  }

  get kpiValorInventario(): number {
    return this.productos.reduce((acc, p) => acc + Number(p.precio_costo) * p.stock_total, 0);
  }

  get kpiBajoMinimo(): number {
    return this.productos.reduce((acc, p) => acc + p.variantes.filter((v) => v.stock_actual <= v.stock_minimo).length, 0);
  }

  async abrirNuevo() {
    const modal = await this.modalCtrl.create({
      component: ProductoFormModal,
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--producto'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Producto creado');
      this.cargar();
    }
  }

  async abrirEditar(producto: ProductoDetalle) {
    const detalle = await firstValueFrom(this.productoSvc.obtener(producto.id));
    const modal = await this.modalCtrl.create({
      component: ProductoFormModal,
      componentProps: { producto: detalle },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--producto'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Producto actualizado');
      this.cargar();
    }
  }

  async abrirVariantes(producto: ProductoDetalle) {
    const modal = await this.modalCtrl.create({
      component: VariantesManagerModal,
      componentProps: { productoId: producto.id, productoNombre: producto.nombre },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--variantes'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.huboCambios) {
      this.cargar();
    }
  }

  async confirmarEliminar(producto: ProductoDetalle) {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Eliminar producto',
        mensaje: `¿Eliminar "${producto.nombre}"? El histórico se mantiene.`,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.productoSvc.eliminar(producto.id).subscribe(() => {
        this.mostrarToast('Producto eliminado');
        this.cargar();
      });
    }
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
