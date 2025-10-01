import { Reserva } from '../types';
import { cajaStorage } from './caja';   // 👈 agregado acá

const STORAGE_KEY = 'circulo-sport-reservas';

export const reservasStorage = {
  getAll(): Reserva[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const reservas = JSON.parse(data);
      return reservas.map((r: any) => ({
        ...r,
        created_at: new Date(r.created_at)
      }));
    } catch (error) {
      console.error('Error loading reservas:', error);
      return [];
    }
  },

  getByDate(fecha: string): Reserva[] {
    return this.getAll().filter(r => r.fecha === fecha);
  },

  getById(id: string): Reserva | null {
    return this.getAll().find(r => r.id === id) || null;
  },

  save(reserva: Reserva): void {
    try {
      const reservas = this.getAll();
      const existingIndex = reservas.findIndex(r => r.id === reserva.id);
      
      if (existingIndex >= 0) {
        reservas[existingIndex] = reserva;
      } else {
        reservas.push(reserva);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservas));
    } catch (error) {
      console.error('Error saving reserva:', error);
      throw error;
    }
  },

  delete(id: string): void {
    try {
      // Eliminar también las transacciones de caja relacionadas
      cajaStorage.deleteByReservaId(id);

      const reservas = this.getAll().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservas));
    } catch (error) {
      console.error('Error deleting reserva:', error);
      throw error;
    }
  },

  isSlotAvailable(cancha_id: string, fecha: string, hora_inicio: string, hora_fin: string, excludeId?: string): boolean {
    const reservas = this.getByDate(fecha);
    
    const startTime = this.parseTime(hora_inicio);
    const endTime = this.parseTime(hora_fin);
    
    return !reservas.some(r => {
      if (r.cancha_id !== cancha_id) return false;
      if (r.estado === 'cancelada') return false;
      if (excludeId && r.id === excludeId) return false;
      
      const rStartTime = this.parseTime(r.hora_inicio);
      const rEndTime = this.parseTime(r.hora_fin);
      
      return (startTime < rEndTime && endTime > rStartTime);
    });
  },

  parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
};
