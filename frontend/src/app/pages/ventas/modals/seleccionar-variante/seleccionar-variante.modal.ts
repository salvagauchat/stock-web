import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { VarianteProducto } from '../../../../models/producto.model';
import { etiquetaVariante, swatchColor } from '../../../../shared/presentacion';

@Component({
  selector: 'app-seleccionar-variante',
  standalone: true,
  imports: [],
  templateUrl: './seleccionar-variante.modal.html',
  styleUrl: './seleccionar-variante.modal.scss',
})
export class SeleccionarVarianteModal {
  @Input() productoNombre = '';
  @Input() variantes: VarianteProducto[] = [];

  readonly etiqueta = etiquetaVariante;

  constructor(private modalCtrl: ModalController) {}

  swatch(v: VarianteProducto): string {
    return swatchColor(v.color);
  }

  elegir(variante: VarianteProducto) {
    this.modalCtrl.dismiss({ variante }, 'confirm');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
