import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { VentaService } from '../../core/services/venta.service';
import { Venta } from '../../models/venta.model';
import { DetalleVentaModal } from './modals/detalle-venta/detalle-venta.modal';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, IonBackButton, IonBadge, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  templateUrl: './historial.page.html',
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

  colorEstado(estado: string): string {
    if (estado === 'ANULADA') return 'danger';
    if (estado === 'PARCIAL_DEVUELTA') return 'warning';
    return 'success';
  }

  async abrirDetalle(venta: Venta) {
    const modal = await this.modalCtrl.create({ component: DetalleVentaModal, componentProps: { ventaId: venta.id } });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.huboCambios) {
      this.cargar();
    }
  }
}
