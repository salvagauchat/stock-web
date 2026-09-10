import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { ConfigMedioPagoService } from '../../../../core/services/config-medio-pago.service';
import { ConfigMedioPago, MedioPago } from '../../../../models/config-medio-pago.model';
import { PagoCreate } from '../../../../models/venta.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

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

const ICONO_POR_MEDIO: Record<MedioPago, string> = {
  EFECTIVO: 'ph-money',
  TRANSFERENCIA: 'ph-arrows-left-right',
  DEBITO: 'ph-credit-card',
  CREDITO: 'ph-credit-card',
};

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [FormsModule, MoneyPipe],
  templateUrl: './pago.modal.html',
  styleUrl: './pago.modal.scss',
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

  icono(medio: MedioPago): string {
    return ICONO_POR_MEDIO[medio];
  }

  private recargoVigente(config: ConfigMedioPago): number {
    if (config.medio_pago === 'CREDITO') {
      return this.cuotasOpciones.find((o) => o.cuotas === this.cuotas)?.recargo ?? 0;
    }
    return Number(config.recargo_porcentaje);
  }

  regla(config: ConfigMedioPago): string {
    const desc = Number(config.descuento_porcentaje);
    const rec = this.recargoVigente(config);
    if (desc) {
      return `${desc}% desc.`;
    }
    if (rec) {
      return `${rec}% rec.`;
    }
    return 'sin ajuste';
  }

  totalParaConfig(config: ConfigMedioPago): number {
    const desc = Number(config.descuento_porcentaje);
    const rec = this.recargoVigente(config);
    return this.subtotal * (1 - desc / 100) * (1 + rec / 100);
  }

  seleccionarSimple(config: ConfigMedioPago) {
    this.medioSeleccionado = config.medio_pago;
    this.descuentoPorcentaje = Number(config.descuento_porcentaje);
    this.recargoPorcentaje = this.recargoVigente(config);
    if (config.medio_pago !== 'CREDITO') {
      this.cuotas = 1;
    }
  }

  elegirCuotas(opcion: { cuotas: number; recargo: number }) {
    this.cuotas = opcion.cuotas;
    if (this.medioSeleccionado === 'CREDITO') {
      this.recargoPorcentaje = opcion.recargo;
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
    return Math.max(0, this.subtotal - this.sumaSubtotalMixto);
  }

  get mixtoCubierto(): boolean {
    return this.sumaSubtotalMixto >= this.subtotal;
  }

  get totalMixto(): number {
    return this.lineasMixtas.filter((l) => l.monto_subtotal > 0).reduce((acc, l) => acc + this.totalLinea(l), 0);
  }

  get mixtoValido(): boolean {
    return Math.abs(this.subtotal - this.sumaSubtotalMixto) < 0.01 && this.totalMixto > 0;
  }

  get totalACobrar(): number {
    return this.modo === 'simple' ? this.totalSimple : this.totalMixto;
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
