export type MedioPago = 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA';

export interface ConfigMedioPago {
  medio_pago: MedioPago;
  descuento_porcentaje: string;
  recargo_porcentaje: string;
  habilitado: boolean;
  arancel_banco_porcentaje: string;
}
