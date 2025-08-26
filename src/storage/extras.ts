import { ExtraDisponible } from '../types';

const STORAGE_KEY = 'circulo-sport-extras';

export const extrasStorage = {
  getAll(): ExtraDisponible[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.initializeDefaultExtras();
        return this.getAll();
      }
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading extras:', error);
      return [];
    }
  },

  save(extra: ExtraDisponible): void {
    try {
      const extras = this.getAll();
      const existingIndex = extras.findIndex(e => e.id === extra.id);
      
      if (existingIndex >= 0) {
        extras[existingIndex] = extra;
      } else {
        extras.push(extra);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
    } catch (error) {
      console.error('Error saving extra:', error);
      throw error;
    }
  },

  delete(id: string): void {
    try {
      const extras = this.getAll().filter(e => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
    } catch (error) {
      console.error('Error deleting extra:', error);
      throw error;
    }
  },

  initializeDefaultExtras(): void {
    const defaultExtras: ExtraDisponible[] = [
      { id: 'extra-1', nombre: 'Alquiler de paletas', precio: 2000 },
      { id: 'extra-2', nombre: 'Tubo de pelotas', precio: 3000 },
      { id: 'extra-3', nombre: 'Cubre grips', precio: 1000 },
      { id: 'extra-4', nombre: 'Protectores', precio: 1500 }
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultExtras));
  }
};