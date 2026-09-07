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
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../models/categoria.model';
import { CategoriaFormModal } from './modals/categoria-form/categoria-form.modal';

@Component({
  selector: 'app-categorias',
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
  templateUrl: './categorias.page.html',
})
export class CategoriasPage implements OnInit {
  categorias: Categoria[] = [];
  cargando = signal(false);

  constructor(
    private categoriaSvc: CategoriaService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.categoriaSvc.listar(true).subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  async abrirNueva() {
    const modal = await this.modalCtrl.create({ component: CategoriaFormModal });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Categoría creada');
      this.cargar();
    }
  }

  async abrirEditar(categoria: Categoria) {
    const modal = await this.modalCtrl.create({
      component: CategoriaFormModal,
      componentProps: { categoria },
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Categoría actualizada');
      this.cargar();
    }
  }

  async confirmarEliminar(categoria: Categoria) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar categoría',
      message: `¿Eliminar "${categoria.nombre}"? Los productos que la usan quedan sin categoría.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.categoriaSvc.eliminar(categoria.id).subscribe(() => {
              this.mostrarToast('Categoría eliminada');
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
