import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';

export interface ConfirmDialogResult {
  confirmado: boolean;
  motivo?: string;
}

/* Diálogo de confirmación genérico con el estilo Nocturne, usado en vez
   de AlertController.create() para que las confirmaciones (eliminar
   producto/categoría/proveedor/variante, anular venta) se vean como el
   resto de la app y no como un alert nativo de Ionic. Abrir con
   cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'] y leer el
   resultado en onWillDismiss(): ConfirmDialogResult | undefined. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './confirm-dialog.modal.html',
  styleUrl: './confirm-dialog.modal.scss',
})
export class ConfirmDialogModal {
  @Input() titulo = 'Confirmar';
  @Input() mensaje = '';
  @Input() textoConfirmar = 'Eliminar';
  @Input() textoCancelar = 'Cancelar';
  @Input() pedirMotivo = false;
  @Input() motivoPlaceholder = 'Motivo';
  @Input() motivoRequerido = false;

  motivo = '';
  error = signal<string | null>(null);

  constructor(private modalCtrl: ModalController) {}

  confirmar() {
    if (this.pedirMotivo && this.motivoRequerido && !this.motivo.trim()) {
      this.error.set('El motivo es obligatorio');
      return;
    }
    const resultado: ConfirmDialogResult = { confirmado: true };
    if (this.pedirMotivo) {
      resultado.motivo = this.motivo.trim();
    }
    this.modalCtrl.dismiss(resultado, 'confirm');
  }

  cancelar() {
    this.modalCtrl.dismiss({ confirmado: false } as ConfirmDialogResult, 'cancel');
  }
}
