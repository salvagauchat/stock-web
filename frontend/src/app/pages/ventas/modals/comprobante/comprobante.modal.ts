import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { VentaDetalle } from '../../../../models/venta.model';

@Component({
  selector: 'app-comprobante',
  standalone: true,
  imports: [DatePipe, IonButton, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  templateUrl: './comprobante.modal.html',
})
export class ComprobanteModal {
  @Input() venta!: VentaDetalle;

  constructor(private modalCtrl: ModalController) {}

  etiquetaVariante(d: { variante_talle: string | null; variante_color: string | null }): string {
    const partes = [d.variante_talle, d.variante_color].filter(Boolean);
    return partes.length ? ` (${partes.join(' / ')})` : '';
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
