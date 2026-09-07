import { Component, Input } from '@angular/core';
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
import { VarianteProducto } from '../../../../models/producto.model';

@Component({
  selector: 'app-seleccionar-variante',
  standalone: true,
  imports: [IonButton, IonButtons, IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  templateUrl: './seleccionar-variante.modal.html',
})
export class SeleccionarVarianteModal {
  @Input() productoNombre = '';
  @Input() variantes: VarianteProducto[] = [];

  constructor(private modalCtrl: ModalController) {}

  etiqueta(v: VarianteProducto): string {
    if (!v.talle && !v.color) {
      return 'General';
    }
    return [v.talle, v.color].filter(Boolean).join(' / ');
  }

  elegir(variante: VarianteProducto) {
    this.modalCtrl.dismiss({ variante }, 'confirm');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
