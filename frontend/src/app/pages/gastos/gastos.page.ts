import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { GastoService } from '../../core/services/gasto.service';
import { Gasto, TipoGasto } from '../../models/gasto.model';
import { ConfirmDialogModal } from '../../shared/modals/confirm-dialog/confirm-dialog.modal';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CategoriasGastoModal } from './modals/categorias-gasto/categorias-gasto.modal';
import { GastoFormModal } from './modals/gasto-form/gasto-form.modal';

type Periodo = 'hoy' | 'semana' | 'mes' | 'anio';

const MEDIO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferencia',
};

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [FormsModule, DatePipe, MoneyPipe],
  templateUrl: './gastos.page.html',
  styleUrl: './gastos.page.scss',
})
export class GastosPage implements OnInit {
  gastosTodos: Gasto[] = [];
  gastosFiltrados: Gasto[] = [];
  filtroTipo: 'TODOS' | TipoGasto = 'TODOS';
  periodoActivo: Periodo | null = 'mes';
  desde: string;
  hasta: string;
  cargando = signal(false);

  constructor(
    private gastoSvc: GastoService,
    private modalCtrl: ModalController,
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

  medioLabel(medio: string): string {
    return MEDIO_LABEL[medio] ?? medio;
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

  setearRangoRapido(periodo: Periodo) {
    const hoy = new Date();
    let inicio: Date;
    switch (periodo) {
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
    this.periodoActivo = periodo;
    this.desde = inicio.toISOString().slice(0, 10);
    this.hasta = hoy.toISOString().slice(0, 10);
    this.cargar();
  }

  fechasPersonalizadas() {
    this.periodoActivo = null;
    this.cargar();
  }

  async abrirNuevo() {
    const modal = await this.modalCtrl.create({
      component: GastoFormModal,
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--gasto'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Gasto registrado');
      this.cargar();
    }
  }

  async abrirEditar(gasto: Gasto) {
    const modal = await this.modalCtrl.create({
      component: GastoFormModal,
      componentProps: { gasto },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--gasto'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Gasto actualizado');
      this.cargar();
    }
  }

  async confirmarEliminar(gasto: Gasto) {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Eliminar gasto',
        mensaje: `¿Eliminar "${gasto.descripcion}" por $${gasto.monto}?`,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.gastoSvc.eliminar(gasto.id).subscribe(() => {
        this.mostrarToast('Gasto eliminado');
        this.cargar();
      });
    }
  }

  async abrirCategorias() {
    const modal = await this.modalCtrl.create({
      component: CategoriasGastoModal,
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--categorias-gasto'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.huboCambios) {
      this.cargar();
    }
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
