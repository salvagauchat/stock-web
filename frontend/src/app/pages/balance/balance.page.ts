import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import Chart from 'chart.js/auto';
import { AuthService } from '../../core/services/auth.service';
import { BalanceService } from '../../core/services/balance.service';
import { Balance } from '../../models/balance.model';

type Periodo = 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado';

const MEDIOS_PAGO: Array<{ key: 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA'; label: string }> = [
  { key: 'EFECTIVO', label: 'Efectivo' },
  { key: 'DEBITO', label: 'Débito' },
  { key: 'CREDITO', label: 'Crédito' },
  { key: 'TRANSFERENCIA', label: 'Transferencia' },
];

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './balance.page.html',
  styleUrl: './balance.page.scss',
})
export class BalancePage implements OnInit {
  @ViewChild('chartEvolucion') chartEvolucionRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMedios') chartMediosRef?: ElementRef<HTMLCanvasElement>;

  periodo: Periodo = 'mes';
  desde = '';
  hasta = '';
  balance: Balance | null = null;
  cargando = signal(false);
  mediosPago = MEDIOS_PAGO;

  private chartEvolucion?: Chart;
  private chartMedios?: Chart;

  constructor(
    private balanceSvc: BalanceService,
    private auth: AuthService,
  ) {}

  logout() {
    this.auth.logout();
  }

  ngOnInit() {
    this.setPeriodo('mes');
  }

  setPeriodo(periodo: Periodo) {
    this.periodo = periodo;
    if (periodo === 'personalizado') {
      return;
    }

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

  fechaPersonalizadaCambio() {
    this.periodo = 'personalizado';
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
        setTimeout(() => this.renderizarCharts(), 50);
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

  private renderizarCharts() {
    if (!this.balance) return;

    if (this.chartEvolucionRef?.nativeElement) {
      this.chartEvolucion?.destroy();

      const labels = this.balance.balance_diario.map((d) =>
        new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      );

      this.chartEvolucion = new Chart(this.chartEvolucionRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Ingresos',
              data: this.balance.balance_diario.map((d) => Number(d.ingresos)),
              borderColor: '#2dd36f',
              backgroundColor: 'rgba(45, 211, 111, 0.1)',
              fill: true,
              tension: 0.3,
            },
            {
              label: 'Egresos',
              data: this.balance.balance_diario.map((d) => Number(d.egresos)),
              borderColor: '#eb445a',
              backgroundColor: 'rgba(235, 68, 90, 0.1)',
              fill: true,
              tension: 0.3,
            },
            {
              label: 'Balance',
              data: this.balance.balance_diario.map((d) => Number(d.balance)),
              borderColor: '#3880ff',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }

    if (this.chartMediosRef?.nativeElement) {
      this.chartMedios?.destroy();
      const ingresos = this.balance.ingresos_por_medio;

      this.chartMedios = new Chart(this.chartMediosRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Efectivo', 'Débito', 'Crédito', 'Transferencia'],
          datasets: [
            {
              data: [
                Number(ingresos.EFECTIVO),
                Number(ingresos.DEBITO),
                Number(ingresos.CREDITO),
                Number(ingresos.TRANSFERENCIA),
              ],
              backgroundColor: ['#2dd36f', '#3880ff', '#7044ff', '#ffc409'],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
        },
      });
    }
  }
}
