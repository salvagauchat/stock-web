import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { VentaDetalle } from '../../../../models/venta.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-comprobante',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './comprobante.modal.html',
  styleUrl: './comprobante.modal.scss',
})
export class ComprobanteModal {
  @Input() venta!: VentaDetalle;

  constructor(private modalCtrl: ModalController) {}

  get cantidadArticulos(): number {
    return this.venta.detalles.reduce((acc, d) => acc + d.cantidad, 0);
  }

  get resumenMedio(): string {
    if (this.venta.pagos.length > 1) {
      return 'pago mixto';
    }
    return this.venta.pagos[0]?.medio_pago.toLowerCase() ?? '';
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  imprimir() {
    window.print();
  }
}
