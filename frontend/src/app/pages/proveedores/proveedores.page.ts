import { Component, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { ProductoService } from '../../core/services/producto.service';
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../models/proveedor.model';
import { ConfirmDialogModal } from '../../shared/modals/confirm-dialog/confirm-dialog.modal';
import { ProveedorFormModal } from './modals/proveedor-form/proveedor-form.modal';

interface ProveedorResumen {
  proveedor: Proveedor;
  articulos: number;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [],
  templateUrl: './proveedores.page.html',
  styleUrl: './proveedores.page.scss',
})
export class ProveedoresPage implements OnInit {
  resumenes: ProveedorResumen[] = [];
  cargando = signal(false);

  constructor(
    private proveedorSvc: ProveedorService,
    private productoSvc: ProductoService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    // activos=false trae activos e inactivos (ver crud/proveedores.py): acá
    // se muestran ambos estados en la tabla, a diferencia del resto de las
    // pantallas que sólo listan activos.
    forkJoin([this.proveedorSvc.listar(false), this.productoSvc.listar(true)]).subscribe({
      next: ([proveedores, productos]) => {
        this.resumenes = proveedores.map((proveedor) => ({
          proveedor,
          articulos: productos.filter((p) => p.proveedor_id === proveedor.id).length,
        }));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  get cantidadActivos(): number {
    return this.resumenes.filter((r) => r.proveedor.activo).length;
  }

  get cantidadBaja(): number {
    return this.resumenes.filter((r) => !r.proveedor.activo).length;
  }

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .map((palabra) => palabra[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  async abrirNuevo() {
    const modal = await this.modalCtrl.create({
      component: ProveedorFormModal,
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--proveedor'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Proveedor creado');
      this.cargar();
    }
  }

  async abrirEditar(proveedor: Proveedor) {
    const modal = await this.modalCtrl.create({
      component: ProveedorFormModal,
      componentProps: { proveedor },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--proveedor'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Proveedor actualizado');
      this.cargar();
    }
  }

  async confirmarEliminar(proveedor: Proveedor) {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Eliminar proveedor',
        mensaje: `¿Eliminar "${proveedor.nombre}"? Los productos que lo usan lo mantienen como referencia histórica.`,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.proveedorSvc.eliminar(proveedor.id).subscribe(() => {
        this.mostrarToast('Proveedor eliminado');
        this.cargar();
      });
    }
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
