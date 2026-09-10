import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import {
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
} from '@ionic/angular/standalone';
import { VentaService } from '../../../../core/services/venta.service';
import { VentaDetalle } from '../../../../models/venta.model';
import { ConfirmDialogModal } from '../../../../shared/modals/confirm-dialog/confirm-dialog.modal';

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [DatePipe, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  templateUrl: './detalle-venta.modal.html',
})
export class DetalleVentaModal implements OnInit {
  @Input() ventaId!: number;

  venta: VentaDetalle | null = null;
  cargando = signal(false);
  huboCambios = false;

  constructor(
    private modalCtrl: ModalController,
    private ventaSvc: VentaService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.ventaSvc.obtener(this.ventaId).subscribe({
      next: (venta) => {
        this.venta = venta;
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  etiquetaVariante(d: { variante_talle: string | null; variante_color: string | null }): string {
    const partes = [d.variante_talle, d.variante_color].filter(Boolean);
    return partes.length ? ` (${partes.join(' / ')})` : '';
  }

  async anular() {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Anular venta',
        mensaje: 'Esta acción repone el stock vendido. Contá el motivo:',
        textoConfirmar: 'Anular',
        pedirMotivo: true,
        motivoPlaceholder: 'Motivo (obligatorio)',
        motivoRequerido: true,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.ventaSvc.anular(this.ventaId, data.motivo).subscribe(() => {
        this.huboCambios = true;
        this.cargar();
      });
    }
  }

  cerrar() {
    this.modalCtrl.dismiss({ huboCambios: this.huboCambios });
  }
}
