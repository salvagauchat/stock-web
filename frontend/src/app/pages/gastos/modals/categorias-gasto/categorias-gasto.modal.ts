import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { GastoService } from '../../../../core/services/gasto.service';
import { CategoriaGasto, TipoGasto } from '../../../../models/gasto.model';

@Component({
  selector: 'app-categorias-gasto',
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
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './categorias-gasto.modal.html',
})
export class CategoriasGastoModal implements OnInit {
  categorias: CategoriaGasto[] = [];

  nombre = '';
  tipo: TipoGasto = 'CORRIENTE';
  descripcion = '';

  error = signal<string | null>(null);

  constructor(
    private modalCtrl: ModalController,
    private gastoSvc: GastoService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.gastoSvc.listarCategorias().subscribe((categorias) => (this.categorias = categorias));
  }

  get categoriasCorrientes(): CategoriaGasto[] {
    return this.categorias.filter((c) => c.tipo === 'CORRIENTE');
  }

  get categoriasNoCorrientes(): CategoriaGasto[] {
    return this.categorias.filter((c) => c.tipo === 'NO_CORRIENTE');
  }

  agregar() {
    if (!this.nombre.trim()) {
      this.error.set('Ingresá un nombre');
      return;
    }
    this.error.set(null);
    this.gastoSvc.crearCategoria({ nombre: this.nombre.trim(), tipo: this.tipo, descripcion: this.descripcion.trim() || undefined }).subscribe({
      next: () => {
        this.nombre = '';
        this.descripcion = '';
        this.tipo = 'CORRIENTE';
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.detail ?? 'No se pudo agregar la categoría');
      },
    });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}
