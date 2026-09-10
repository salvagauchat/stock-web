import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { BalanceService } from '../../core/services/balance.service';
import { ConfigMedioPagoService } from '../../core/services/config-medio-pago.service';
import { Balance } from '../../models/balance.model';
import { ConfigMedioPago, MedioPago } from '../../models/config-medio-pago.model';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

type Periodo = 'hoy' | 'semana' | 'mes' | 'anio' | null;

const MEDIOS_PAGO: Array<{ key: MedioPago; label: string }> = [
  { key: 'EFECTIVO', label: 'Efectivo' },
  { key: 'TRANSFERENCIA', label: 'Transferencia' },
  { key: 'DEBITO', label: 'Débito' },
  { key: 'CREDITO', label: 'Crédito' },
];

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [FormsModule, MoneyPipe],
  templateUrl: './balance.page.html',
  styleUrl: './balance.page.scss',
})
export class BalancePage implements OnInit {
  @ViewChild('chartEvolucion') chartEvolucionRef?: ElementRef<HTMLCanvasElement>;

  periodo: Periodo = 'mes';
  desde = '';
  hasta = '';
  balance: Balance | null = null;
  configs: ConfigMedioPago[] = [];
  cargando = signal(false);
  mediosPago = MEDIOS_PAGO;

  private chartEvolucion?: Chart;

  constructor(
    private balanceSvc: BalanceService,
    private configSvc: ConfigMedioPagoService,
  ) {}

  ngOnInit() {
    this.configSvc.listarHabilitados().subscribe((configs) => (this.configs = configs));
    this.setPeriodo('mes');
  }

  setPeriodo(periodo: Exclude<Periodo, null>) {
    this.periodo = periodo;
    const hoy = new Date();
    let inicio: Date;
    switch (periodo) {
      case 'hoy':
        inicio = new Date(hoy);
        break;
      case 'semana':
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'anio':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        break;
    }
    this.desde = inicio.toISOString().slice(0, 10);
    this.hasta = hoy.toISOString().slice(0, 10);
    this.cargar();
  }

  fechasPersonalizadas() {
    this.periodo = null;
    this.cargar();
  }

  cargar() {
    if (!this.desde || !this.hasta) {
      return;
    }
    this.cargando.set(true);
    this.balanceSvc.obtener(`${this.desde}T00:00:00`, `${this.hasta}T23:59:59`).subscribe({
      next: (balance) => {
        this.balance = balance;
        this.cargando.set(false);
        setTimeout(() => this.renderizarChart(), 0);
      },
      error: () => this.cargando.set(false),
    });
  }

  get egresosTotales(): number {
    if (!this.balance) return 0;
    return Number(this.balance.gastos_corrientes) + Number(this.balance.gastos_no_corrientes);
  }

  get balanceNeto(): number {
    if (!this.balance) return 0;
    return Number(this.balance.ingresos) - this.egresosTotales;
  }

  get ticketPromedio(): number {
    if (!this.balance || !this.balance.cantidad_ventas) return 0;
    return Number(this.balance.ingresos) / this.balance.cantidad_ventas;
  }

  configPara(medio: MedioPago): string {
    const config = this.configs.find((c) => c.medio_pago === medio);
    if (!config) return '—';
    const desc = Number(config.descuento_porcentaje);
    if (desc) return `${desc}% descuento`;
    if (medio === 'CREDITO') return 'recargo por cuotas';
    return 'sin ajuste';
  }

  netoPorMedio(medio: MedioPago): number {
    if (!this.balance) return 0;
    return Number(this.balance.ingresos_por_medio[medio]) - Number(this.balance.egresos_por_medio[medio]);
  }

  barraTop(unidades: number): number {
    if (!this.balance?.top_categorias.length) return 0;
    const max = this.balance.top_categorias[0].unidades_vendidas;
    return max ? Math.round((unidades / max) * 100) : 0;
  }

  private renderizarChart() {
    if (!this.balance || !this.chartEvolucionRef?.nativeElement) {
      return;
    }

    this.chartEvolucion?.destroy();

    const labels = this.balance.balance_diario.map((d) =>
      new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    );

    this.chartEvolucion = new Chart(this.chartEvolucionRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: this.balance.balance_diario.map((d) => Number(d.ingresos)),
            backgroundColor: '#9184d9',
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            maxBarThickness: 16,
          },
          {
            label: 'Egresos',
            data: this.balance.balance_diario.map((d) => Number(d.egresos)),
            backgroundColor: '#4a4d5e',
            borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
            maxBarThickness: 16,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: 'rgba(233,233,237,0.7)', boxWidth: 9, boxHeight: 9, font: { size: 11.5 }, usePointStyle: false },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: 'rgba(233,233,237,0.42)', font: { size: 10.5 } },
          },
          y: { display: false },
        },
      },
    });
  }
}
