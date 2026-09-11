import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { VentaService } from '../../core/services/venta.service';
import { EstadoVenta, Venta } from '../../models/venta.model';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { DetalleVentaModal } from './modals/detalle-venta/detalle-venta.modal';

const ETIQUETA_ESTADO: Record<EstadoVenta, string> = {
  COMPLETADA: 'Completada',
  ANULADA: 'Anulada',
  PARCIAL_DEVUELTA: 'Devuelta parcial',
};

const CLASE_ESTADO: Record<EstadoVenta, string> = {
  COMPLETADA: 'completada',
  ANULADA: 'anulada',
  PARCIAL_DEVUELTA: 'parcial',
};

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink, MoneyPipe],
  templateUrl: './historial.page.html',
  styleUrl: './historial.page.scss',
})
export class HistorialPage implements OnInit {
  ventas: Venta[] = [];
  cargando = signal(false);

  constructor(
    private ventaSvc: VentaService,
    private modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.ventaSvc.listar().subscribe({
      next: (ventas) => {
        this.ventas = ventas;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  etiquetaEstado(estado: EstadoVenta): string {
    return ETIQUETA_ESTADO[estado];
  }

  claseEstado(estado: EstadoVenta): string {
    return CLASE_ESTADO[estado];
  }

  async abrirDetalle(venta: Venta) {
    const modal = await this.modalCtrl.create({
      component: DetalleVentaModal,
      componentProps: { ventaId: venta.id },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--detalle-venta'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.huboCambios) {
      this.cargar();
    }
  }
}
