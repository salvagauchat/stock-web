import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import {
  AlertController,
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
    private alertCtrl: AlertController,
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
    const alert = await this.alertCtrl.create({
      header: 'Anular venta',
      message: 'Esta acción repone el stock vendido. Contá el motivo:',
      inputs: [{ name: 'motivo', type: 'text', placeholder: 'Motivo (obligatorio)' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Anular',
          role: 'destructive',
          handler: (data) => {
            if (!data.motivo || !data.motivo.trim()) {
              return false;
            }
            this.ventaSvc.anular(this.ventaId, data.motivo.trim()).subscribe(() => {
              this.huboCambios = true;
              this.cargar();
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  cerrar() {
    this.modalCtrl.dismiss({ huboCambios: this.huboCambios });
  }
}
