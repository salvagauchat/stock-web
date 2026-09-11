import { DatePipe, NgClass } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { VentaService } from '../../../../core/services/venta.service';
import { EstadoVenta, VentaDetalle } from '../../../../models/venta.model';
import { ConfirmDialogModal } from '../../../../shared/modals/confirm-dialog/confirm-dialog.modal';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

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

const MEDIO_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferencia',
};

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [DatePipe, NgClass, MoneyPipe],
  templateUrl: './detalle-venta.modal.html',
  styleUrl: './detalle-venta.modal.scss',
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

  etiquetaEstado(estado: EstadoVenta): string {
    return ETIQUETA_ESTADO[estado];
  }

  claseEstado(estado: EstadoVenta): string {
    return CLASE_ESTADO[estado];
  }

  medioLabel(medio: string): string {
    return MEDIO_LABEL[medio] ?? medio;
  }

  etiquetaVariante(d: { variante_talle: string | null; variante_color: string | null }): string {
    const partes = [d.variante_talle, d.variante_color].filter(Boolean);
    return partes.length ? partes.join(' / ') : 'General';
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
