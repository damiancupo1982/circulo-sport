import { CierreTurno } from '../types';

const STORAGE_KEY = 'circulo-sport-cierres';

/** Parse seguro a Date (acepta Date o string ISO) */
function toDateSafe(v: any): Date {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date('Invalid') : d;
}

export const cierresStorage = {
  getAll(): CierreTurno[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const cierres = JSON.parse(data);
      return (cierres as any[]).map((c: any) => ({
        ...c,
        fecha_inicio: toDateSafe(c.fecha_inicio),
        fecha_fin: toDateSafe(c.fecha_fin),
        created_at: toDateSafe(c.created_at),
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

      const cierreToSave: CierreTurno = {
        ...cierre,
        fecha_inicio: toDateSafe(cierre.fecha_inicio),
        fecha_fin: toDateSafe(cierre.fecha_fin),
        created_at: toDateSafe(cierre.created_at || new Date()),
      };

      if (existingIndex >= 0) {
        cierres[existingIndex] = cierreToSave;
      } else {
        cierres.push(cierreToSave);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cierres));
    } catch (error) {
      console.error('Error saving cierre:', error);
      throw error;
    }
  },

  getByDateRange(desde: Date, hasta: Date): CierreTurno[] {
    const ini = desde.getTime();
    const fin = hasta.getTime();
    return this.getAll().filter(c => {
      const ts = c.fecha_inicio.getTime();
      return ts >= ini && ts <= fin;
    });
  },

  getByUsuario(usuario: string): CierreTurno[] {
    return this.getAll().filter(c =>
      (c.usuario || '').toLowerCase().includes(usuario.toLowerCase())
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
