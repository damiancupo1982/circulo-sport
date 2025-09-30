import { CierreTurno } from '../types';

const STORAGE_KEY = 'circulo-sport-cierres';

export const cierresStorage = {
  getAll(): CierreTurno[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const cierres = JSON.parse(data);
      return cierres.map((c: any) => ({
        ...c,
        fecha_inicio: new Date(c.fecha_inicio),
        fecha_fin: new Date(c.fecha_fin),
        created_at: new Date(c.created_at)
      }));
    } catch (error) {
      console.error('Error loading cierres:', error);
      return [];
    }
  },

  save(cierre: CierreTurno): void {
    try {
      const cierres = this.getAll();
      const existingIndex = cierres.findIndex(c => c.id === cierre.id);
      
      if (existingIndex >= 0) {
        cierres[existingIndex] = cierre;
      } else {
        cierres.push(cierre);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cierres));
    } catch (error) {
      console.error('Error saving cierre:', error);
      throw error;
    }
  },

  getByDateRange(desde: Date, hasta: Date): CierreTurno[] {
    return this.getAll().filter(c => 
      c.fecha_inicio >= desde && c.fecha_inicio <= hasta
    );
  },

  getByUsuario(usuario: string): CierreTurno[] {
    return this.getAll().filter(c => 
      c.usuario.toLowerCase().includes(usuario.toLowerCase())
    );
  },

  delete(id: string): void {
    try {
      const cierres = this.getAll().filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cierres));
    } catch (error) {
      console.error('Error deleting cierre:', error);
      throw error;
    }
  }
};