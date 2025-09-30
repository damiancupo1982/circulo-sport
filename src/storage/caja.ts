import { TransaccionCaja } from '../types';

const STORAGE_KEY = 'circulo-sport-caja';

/** Fecha local YYYY-MM-DD (evita corrimiento por UTC) */
function ymdLocal(d: Date): string {
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

/** Parse seguro a Date (acepta ISO/string/Date) */
function toDateSafe(v: any): Date {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date('Invalid') : d;
}

/** Número seguro */
function n(x: any): number {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}

export const cajaStorage = {
  getAll(): TransaccionCaja[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const transacciones = JSON.parse(data);
      return (transacciones as any[]).map((t: any) => ({
        ...t,
        monto: n(t.monto),
        fecha_hora: toDateSafe(t.fecha_hora),
      }));
    } catch (error) {
      console.error('Error loading caja:', error);
      return [];
    }
  },

  getByDate(fechaYmdLocal: string): TransaccionCaja[] {
    return this.getAll().filter(t => ymdLocal(t.fecha_hora) === fechaYmdLocal);
  },

  getTotalCaja(): number {
    const transacciones = this.getAll();
    return transacciones.reduce((total, t) => {
      return total + (t.tipo === 'ingreso' ? n(t.monto) : -n(t.monto));
    }, 0);
  },

  getTotalEfectivo(): number {
    const transacciones = this.getAll();
    return transacciones
      .filter(t => t.metodo_pago === 'efectivo')
      .reduce((total, t) => total + (t.tipo === 'ingreso' ? n(t.monto) : -n(t.monto)), 0);
  },

  getTotalTransferencia(): number {
    const transacciones = this.getAll();
    return transacciones
      .filter(t => t.metodo_pago === 'transferencia')
      .reduce((total, t) => total + (t.tipo === 'ingreso' ? n(t.monto) : -n(t.monto)), 0);
  },

  getIngresosPorDia(fechaYmdLocal: string): number {
    const transacciones = this.getByDate(fechaYmdLocal);
    return transacciones
      .filter(t => t.tipo === 'ingreso')
      .reduce((total, t) => total + n(t.monto), 0);
  },

  getIngresosPorDiaYMetodo(
    fechaYmdLocal: string,
    metodo: 'efectivo' | 'transferencia'
  ): number {
    const transacciones = this.getByDate(fechaYmdLocal);
    return transacciones
      .filter(t => t.tipo === 'ingreso' && t.metodo_pago === metodo)
      .reduce((total, t) => total + n(t.monto), 0);
  },

  getRetirosPorDia(fechaYmdLocal: string): number {
    const transacciones = this.getByDate(fechaYmdLocal);
    return transacciones
      .filter(t => t.tipo === 'retiro')
      .reduce((total, t) => total + n(t.monto), 0);
  },

  save(transaccion: TransaccionCaja): void {
    try {
      const transacciones = this.getAll();
      const existingIndex = transacciones.findIndex(t => t.id === transaccion.id);
      const toSave: TransaccionCaja = {
        ...transaccion,
        fecha_hora: toDateSafe(transaccion.fecha_hora || new Date()),
        monto: n(transaccion.monto),
      };
      if (existingIndex >= 0) {
        transacciones[existingIndex] = toSave;
      } else {
        transacciones.push(toSave);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacciones));
    } catch (error) {
      console.error('Error saving transaccion:', error);
      throw error;
    }
  },

  registrarIngreso(
    concepto: string,
    monto: number,
    reserva_id?: string,
    metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente'
  ): void {
    // No registrar ingresos "pendientes"
    if (metodo_pago === 'pendiente') return;

    const transaccion: TransaccionCaja = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'ingreso',
      concepto,
      monto: n(monto),
      fecha_hora: new Date(),
      reserva_id,
      metodo_pago,
    };
    this.save(transaccion);
  },

  registrarRetiro(concepto: string, monto: number): void {
    const transaccion: TransaccionCaja = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'retiro',
      concepto,
      monto: n(monto),
      fecha_hora: new Date(),
      metodo_pago: 'efectivo', // Los retiros siempre son de efectivo
    };
    this.save(transaccion);
  },

  delete(id: string): void {
    try {
      const transacciones = this.getAll().filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacciones));
    } catch (error) {
      console.error('Error deleting transaccion:', error);
      throw error;
    }
  },

  deleteByReservaId(reserva_id: string): void {
    try {
      const transacciones = this.getAll().filter(t => t.reserva_id !== reserva_id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacciones));
    } catch (error) {
      console.error('Error deleting transacciones by reserva_id:', error);
      throw error;
    }
  }
};
