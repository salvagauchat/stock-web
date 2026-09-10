import { Component, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { CategoriaService } from '../../core/services/categoria.service';
import { ProductoService } from '../../core/services/producto.service';
import { Categoria } from '../../models/categoria.model';
import { Producto } from '../../models/producto.model';
import { ConfirmDialogModal } from '../../shared/modals/confirm-dialog/confirm-dialog.modal';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CategoriaFormModal } from './modals/categoria-form/categoria-form.modal';

interface CategoriaResumen {
  categoria: Categoria;
  count: number;
  unidades: number;
  valor: number;
  margen: number;
}

const ICONO_DEFECTO = 'ph-tag';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './categorias.page.html',
  styleUrl: './categorias.page.scss',
})
export class CategoriasPage implements OnInit {
  resumenes: CategoriaResumen[] = [];
  cargando = signal(false);

  constructor(
    private categoriaSvc: CategoriaService,
    private productoSvc: ProductoService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    forkJoin([this.categoriaSvc.listar(true), this.productoSvc.listar(true)]).subscribe({
      next: ([categorias, productos]) => {
        this.resumenes = categorias.map((categoria) => this.resumenPara(categoria, productos));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private resumenPara(categoria: Categoria, productos: Producto[]): CategoriaResumen {
    const items = productos.filter((p) => p.categoria_id === categoria.id);
    const unidades = items.reduce((acc, p) => acc + p.stock_total, 0);
    const valor = items.reduce((acc, p) => acc + Number(p.precio_costo) * p.stock_total, 0);
    const margen = items.length
      ? Math.round(
          (items.reduce((acc, p) => acc + (Number(p.precio_venta) - Number(p.precio_costo)) / Number(p.precio_venta), 0) /
            items.length) *
            100,
        )
      : 0;
    return { categoria, count: items.length, unidades, valor, margen };
  }

  icono(categoria: Categoria): string {
    const valor = categoria.icono?.trim();
    if (!valor) {
      return ICONO_DEFECTO;
    }
    const partes = valor.split(/\s+/);
    return partes[partes.length - 1];
  }

  barraAncho(margen: number): number {
    return Math.min(100, Math.max(0, margen * 1.6));
  }

  async abrirNueva() {
    const modal = await this.modalCtrl.create({
      component: CategoriaFormModal,
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--categoria'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Categoría creada');
      this.cargar();
    }
  }

  async abrirEditar(categoria: Categoria) {
    const modal = await this.modalCtrl.create({
      component: CategoriaFormModal,
      componentProps: { categoria },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--categoria'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.guardado) {
      await this.mostrarToast('Categoría actualizada');
      this.cargar();
    }
  }

  async confirmarEliminar(categoria: Categoria) {
    const modal = await this.modalCtrl.create({
      component: ConfirmDialogModal,
      componentProps: {
        titulo: 'Eliminar categoría',
        mensaje: `¿Eliminar "${categoria.nombre}"? Los productos que la usan quedan sin categoría.`,
      },
      cssClass: ['sl-dialog-modal', 'sl-dialog-modal--confirm'],
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.confirmado) {
      this.categoriaSvc.eliminar(categoria.id).subscribe(() => {
        this.mostrarToast('Categoría eliminada');
        this.cargar();
      });
    }
  }

  private async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2000 });
    await toast.present();
  }
}
