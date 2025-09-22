import { TransaccionCaja } from '../types';

const STORAGE_KEY = 'circulo-sport-caja';

export const cajaStorage = {
  getAll(): TransaccionCaja[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const transacciones = JSON.parse(data);
      return transacciones.map((t: any) => ({
        ...t,
        fecha_hora: new Date(t.fecha_hora)
      }));
    } catch (error) {
      console.error('Error loading caja:', error);
      return [];
    }
  },

  getByDate(fecha: string): TransaccionCaja[] {
    return this.getAll().filter(t =>
      t.fecha_hora.toISOString().split('T')[0] === fecha
    );
  },

  getTotalCaja(): number {
    const transacciones = this.getAll();
    return transacciones.reduce((total, t) => {
      return total + (t.tipo === 'ingreso' ? t.monto : -t.monto);
    }, 0);
  },

  getTotalEfectivo(): number {
    const transacciones = this.getAll();
    return transacciones
      .filter(t => t.metodo_pago === 'efectivo')
      .reduce((total, t) => total + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);
  },

  getTotalTransferencia(): number {
    const transacciones = this.getAll();
    return transacciones
      .filter(t => t.metodo_pago === 'transferencia')
      .reduce((total, t) => total + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);
  },

  getIngresosPorDia(fecha: string): number {
    const transacciones = this.getByDate(fecha);
    return transacciones.filter(t => t.tipo === 'ingreso').reduce((total, t) => total + t.monto, 0);
  },

  getIngresosPorDiaYMetodo(fecha: string, metodo: 'efectivo' | 'transferencia'): number {
    const transacciones = this.getByDate(fecha);
    return transacciones
      .filter(t => t.tipo === 'ingreso' && t.metodo_pago === metodo)
      .reduce((total, t) => total + t.monto, 0);
  },

  getRetirosPorDia(fecha: string): number {
    const transacciones = this.getByDate(fecha);
    return transacciones.filter(t => t.tipo === 'retiro').reduce((total, t) => total + t.monto, 0);
  },

  save(transaccion: TransaccionCaja): void {
    try {
      const transacciones = this.getAll();
      const existingIndex = transacciones.findIndex(t => t.id === transaccion.id);
      if (existingIndex >= 0) {
        transacciones[existingIndex] = transaccion;
      } else {
        transacciones.push(transaccion);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transacciones));
    } catch (error) {
      console.error('Error saving transaccion:', error);
      throw error;
    }
  },

  registrarIngreso(concepto: string, monto: number, reserva_id?: string, metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente'): void {
    // No registrar ingresos "pendientes"
    if (metodo_pago === 'pendiente') return;
    const transaccion: TransaccionCaja = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'ingreso',
      concepto,
      monto,
      fecha_hora: new Date(),
      reserva_id,
      metodo_pago
    };
    this.save(transaccion);
  },

  registrarRetiro(concepto: string, monto: number): void {
    const transaccion: TransaccionCaja = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: 'retiro',
      concepto,
      monto,
      fecha_hora: new Date(),
      metodo_pago: 'efectivo' // Los retiros siempre son de efectivo
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
