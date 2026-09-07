import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { ConfigMedioPagoService } from '../../../../core/services/config-medio-pago.service';
import { ConfigMedioPago, MedioPago } from '../../../../models/config-medio-pago.model';
import { PagoCreate } from '../../../../models/venta.model';

interface LineaMixta {
  medio_pago: MedioPago;
  monto_subtotal: number;
  descuento_porcentaje: number;
  recargo_porcentaje: number;
}

const CUOTAS_OPCIONES = [
  { cuotas: 1, recargo: 0 },
  { cuotas: 3, recargo: 10 },
  { cuotas: 6, recargo: 20 },
  { cuotas: 12, recargo: 35 },
];

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './pago.modal.html',
})
export class PagoModal implements OnInit {
  @Input() subtotal = 0;

  configs: ConfigMedioPago[] = [];
  modo: 'simple' | 'mixto' = 'simple';
  cuotasOpciones = CUOTAS_OPCIONES;

  // Modo simple
  medioSeleccionado: MedioPago | null = null;
  descuentoPorcentaje = 0;
  recargoPorcentaje = 0;
  cuotas = 1;

  // Modo mixto
  lineasMixtas: LineaMixta[] = [];

  error = signal<string | null>(null);

  constructor(
    private modalCtrl: ModalController,
    private configSvc: ConfigMedioPagoService,
  ) {}

  ngOnInit() {
    this.configSvc.listarHabilitados().subscribe((configs) => {
      this.configs = configs;
      this.lineasMixtas = configs.map((c) => ({
        medio_pago: c.medio_pago,
        monto_subtotal: 0,
        descuento_porcentaje: Number(c.descuento_porcentaje),
        recargo_porcentaje: Number(c.recargo_porcentaje),
      }));
    });
  }

  cambiarModo(modo: 'simple' | 'mixto') {
    this.modo = modo;
    this.error.set(null);
  }

  seleccionarSimple(config: ConfigMedioPago) {
    this.medioSeleccionado = config.medio_pago;
    this.descuentoPorcentaje = Number(config.descuento_porcentaje);
    this.recargoPorcentaje = Number(config.recargo_porcentaje);
    this.cuotas = 1;
  }

  elegirCuotas(opcion: { cuotas: number; recargo: number }) {
    this.cuotas = opcion.cuotas;
    this.recargoPorcentaje = opcion.recargo;
  }

  onCuotasChange(valor: number) {
    const opcion = this.cuotasOpciones.find((o) => o.cuotas === valor);
    if (opcion) {
      this.elegirCuotas(opcion);
    }
  }

  get totalSimple(): number {
    return this.subtotal * (1 - this.descuentoPorcentaje / 100) * (1 + this.recargoPorcentaje / 100);
  }

  totalLinea(linea: LineaMixta): number {
    return linea.monto_subtotal * (1 - linea.descuento_porcentaje / 100) * (1 + linea.recargo_porcentaje / 100);
  }

  get sumaSubtotalMixto(): number {
    return this.lineasMixtas.reduce((acc, l) => acc + (l.monto_subtotal || 0), 0);
  }

  get diferenciaMixto(): number {
    return this.subtotal - this.sumaSubtotalMixto;
  }

  get totalMixto(): number {
    return this.lineasMixtas
      .filter((l) => l.monto_subtotal > 0)
      .reduce((acc, l) => acc + this.totalLinea(l), 0);
  }

  get mixtoValido(): boolean {
    return Math.abs(this.diferenciaMixto) < 0.01 && this.totalMixto > 0;
  }

  asignarRestoA(linea: LineaMixta) {
    const otras = this.sumaSubtotalMixto - (linea.monto_subtotal || 0);
    linea.monto_subtotal = Math.max(0, this.subtotal - otras);
  }

  confirmar() {
    let pagos: PagoCreate[];

    if (this.modo === 'simple') {
      if (!this.medioSeleccionado) {
        this.error.set('Elegí un medio de pago');
        return;
      }
      pagos = [
        {
          medio_pago: this.medioSeleccionado,
          monto_subtotal: this.subtotal,
          descuento_porcentaje: this.descuentoPorcentaje,
          recargo_porcentaje: this.recargoPorcentaje,
          cuotas: this.medioSeleccionado === 'CREDITO' ? this.cuotas : undefined,
        },
      ];
    } else {
      if (!this.mixtoValido) {
        this.error.set('Los montos repartidos no cubren el total a pagar');
        return;
      }
      pagos = this.lineasMixtas
        .filter((l) => l.monto_subtotal > 0)
        .map((l) => ({
          medio_pago: l.medio_pago,
          monto_subtotal: l.monto_subtotal,
          descuento_porcentaje: l.descuento_porcentaje,
          recargo_porcentaje: l.recargo_porcentaje,
        }));
    }

    this.modalCtrl.dismiss({ confirmado: true, pagos }, 'confirm');
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
