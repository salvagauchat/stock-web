import { Component, OnInit, signal } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { ProveedorService } from '../../core/services/proveedor.service';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedorFormModal } from './modals/proveedor-form/proveedor-form.modal';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './proveedores.page.html',
})
export class ProveedoresPage implements OnInit {
  proveedores: Proveedor[] = [];
  cargando = signal(false);

  constructor(
    private proveedorSvc: ProveedorService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.proveedorSvc.listar(true).subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  async abrirNuevo() {
    const modal = await this.modalCtrl.create({ component: ProveedorFormModal });
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
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Proveedor actualizado');
      this.cargar();
    }
  }

  async confirmarEliminar(proveedor: Proveedor) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar proveedor',
      message: `¿Eliminar "${proveedor.nombre}"? Los productos que lo usan lo mantienen como referencia histórica.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.proveedorSvc.eliminar(proveedor.id).subscribe(() => {
              this.mostrarToast('Proveedor eliminado');
              this.cargar();
            });
          },
        },
      ],
    });
    await alert.present();
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
