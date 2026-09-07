import { HttpErrorResponse } from '@angular/common/http';
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { GastoService } from '../../../../core/services/gasto.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { MedioPago } from '../../../../models/config-medio-pago.model';
import { CategoriaGasto, Gasto } from '../../../../models/gasto.model';
import { Proveedor } from '../../../../models/proveedor.model';

const MEDIOS_PAGO: MedioPago[] = ['EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA'];

@Component({
  selector: 'app-gasto-form',
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
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './gasto-form.modal.html',
})
export class GastoFormModal implements OnInit {
  @Input() gasto: Gasto | null = null;

  categorias: CategoriaGasto[] = [];
  proveedores: Proveedor[] = [];
  mediosPago = MEDIOS_PAGO;

  categoriaGastoId: number | null = null;
  descripcion = '';
  monto = 0;
  medioPago: MedioPago = 'EFECTIVO';
  proveedorId: number | null = null;
  comprobanteNumero = '';
  notas = '';

  guardando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private modalCtrl: ModalController,
    private gastoSvc: GastoService,
    private proveedorSvc: ProveedorService,
  ) {}

  get esEdicion(): boolean {
    return !!this.gasto;
  }

  ngOnInit() {
    this.gastoSvc.listarCategorias().subscribe((cats) => (this.categorias = cats));
    this.proveedorSvc.listar().subscribe((provs) => (this.proveedores = provs));

    if (this.gasto) {
      this.categoriaGastoId = this.gasto.categoria_gasto_id;
      this.descripcion = this.gasto.descripcion;
      this.monto = Number(this.gasto.monto);
      this.medioPago = this.gasto.medio_pago;
      this.proveedorId = this.gasto.proveedor_id;
      this.comprobanteNumero = this.gasto.comprobante_numero ?? '';
      this.notas = this.gasto.notas ?? '';
    }
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  guardar() {
    if (!this.categoriaGastoId) {
      this.error.set('Elegí una categoría');
      return;
    }
    if (!this.descripcion.trim()) {
      this.error.set('La descripción es obligatoria');
      return;
    }
    if (this.monto <= 0) {
      this.error.set('El monto tiene que ser mayor a 0');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const datos = {
      categoria_gasto_id: this.categoriaGastoId,
      descripcion: this.descripcion.trim(),
      monto: this.monto,
      medio_pago: this.medioPago,
      proveedor_id: this.proveedorId,
      comprobante_numero: this.comprobanteNumero.trim() || undefined,
      notas: this.notas.trim() || undefined,
    };

    const operacion = this.gasto ? this.gastoSvc.actualizar(this.gasto.id, datos) : this.gastoSvc.crear(datos);

    operacion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalCtrl.dismiss({ guardado: true }, 'confirm');
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(err.error?.detail ?? 'No se pudo guardar');
      },
    });
  }
}
