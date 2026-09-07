import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { GastoService } from '../../core/services/gasto.service';
import { Gasto, TipoGasto } from '../../models/gasto.model';
import { CategoriasGastoModal } from './modals/categorias-gasto/categorias-gasto.modal';
import { GastoFormModal } from './modals/gasto-form/gasto-form.modal';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './gastos.page.html',
})
export class GastosPage implements OnInit {
  gastosTodos: Gasto[] = [];
  gastosFiltrados: Gasto[] = [];
  filtroTipo: 'TODOS' | TipoGasto = 'TODOS';
  desde: string;
  hasta: string;
  cargando = signal(false);

  constructor(
    private gastoSvc: GastoService,
    private auth: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.desde = primerDia.toISOString().slice(0, 10);
    this.hasta = hoy.toISOString().slice(0, 10);
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.gastoSvc.listar({ desde: `${this.desde}T00:00:00`, hasta: `${this.hasta}T23:59:59` }).subscribe({
      next: (gastos) => {
        this.gastosTodos = gastos;
        this.aplicarFiltroTipo();
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  aplicarFiltroTipo() {
    this.gastosFiltrados =
      this.filtroTipo === 'TODOS' ? this.gastosTodos : this.gastosTodos.filter((g) => g.categoria_tipo === this.filtroTipo);
  }

  cambiarFiltroTipo(tipo: 'TODOS' | TipoGasto) {
    this.filtroTipo = tipo;
    this.aplicarFiltroTipo();
  }

  get totalCorriente(): number {
    return this.gastosTodos.filter((g) => g.categoria_tipo === 'CORRIENTE').reduce((acc, g) => acc + Number(g.monto), 0);
  }

  get totalNoCorriente(): number {
    return this.gastosTodos
      .filter((g) => g.categoria_tipo === 'NO_CORRIENTE')
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }

  get totalGeneral(): number {
    return this.totalCorriente + this.totalNoCorriente;
  }

  setearRangoRapido(rango: 'hoy' | 'semana' | 'mes' | 'anio') {
    const hoy = new Date();
    let inicio: Date;
    switch (rango) {
      case 'hoy':
        inicio = new Date(hoy);
        break;
      case 'semana':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'anio':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        break;
    }
    this.desde = inicio.toISOString().slice(0, 10);
    this.hasta = hoy.toISOString().slice(0, 10);
    this.cargar();
  }

  async abrirNuevo() {
    const modal = await this.modalCtrl.create({ component: GastoFormModal });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Gasto registrado');
      this.cargar();
    }
  }

  async abrirEditar(gasto: Gasto) {
    const modal = await this.modalCtrl.create({ component: GastoFormModal, componentProps: { gasto } });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Gasto actualizado');
      this.cargar();
    }
  }

  async confirmarEliminar(gasto: Gasto) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar gasto',
      message: `¿Eliminar "${gasto.descripcion}" por $${gasto.monto}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.gastoSvc.eliminar(gasto.id).subscribe(() => {
              this.mostrarToast('Gasto eliminado');
              this.cargar();
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async abrirCategorias() {
    const modal = await this.modalCtrl.create({ component: CategoriasGastoModal });
    await modal.present();
  }

  logout() {
    this.auth.logout();
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
