import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AlertController,
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
import { Producto } from '../../models/producto.model';
import { ProductoFormModal } from './modals/producto-form/producto-form.modal';
import { VariantesManagerModal } from './modals/variantes-manager/variantes-manager.modal';

@Component({
  selector: 'app-stock',
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
  templateUrl: './stock.page.html',
})
export class StockPage implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  busqueda = '';
  cargando = signal(false);

  constructor(
    private productoSvc: ProductoService,
    private auth: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.productoSvc.listar(true).subscribe({
      next: (productos) => {
        this.productos = productos;
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
            [p.nombre, p.marca, p.categoria_nombre].some((campo) => campo?.toLowerCase().includes(termino)),
        );
  }

  async abrirNuevo() {
    const modal = await this.modalCtrl.create({ component: ProductoFormModal });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Producto creado');
      this.cargar();
    }
  }

  async abrirEditar(producto: Producto) {
    const detalle = await firstValueFrom(this.productoSvc.obtener(producto.id));
    const modal = await this.modalCtrl.create({
      component: ProductoFormModal,
      componentProps: { producto: detalle },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Producto actualizado');
      this.cargar();
    }
  }

  async abrirVariantes(producto: Producto) {
    const modal = await this.modalCtrl.create({
      component: VariantesManagerModal,
      componentProps: { productoId: producto.id, productoNombre: producto.nombre },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.huboCambios) {
      this.cargar();
    }
  }

  async confirmarEliminar(producto: Producto) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Eliminar "${producto.nombre}"? El histórico se mantiene.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.productoSvc.eliminar(producto.id).subscribe(() => {
              this.mostrarToast('Producto eliminado');
              this.cargar();
            });
          },
        },
      ],
    });
    await alert.present();
  }

  logout() {
    this.auth.logout();
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
