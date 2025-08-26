import { Cliente } from '../types';

const STORAGE_KEY = 'circulo-sport-clientes';

const generateNumeroSocio = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const clientes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  
  // Encontrar el último número de socio del año actual
  const currentYearSocios = clientes
    .filter((c: any) => c.numero_socio?.startsWith(year + '-'))
    .map((c: any) => parseInt(c.numero_socio.split('-')[1]))
    .filter((num: number) => !isNaN(num));
  
  const nextNumber = currentYearSocios.length > 0 ? Math.max(...currentYearSocios) + 1 : 1;
  return `${year}-${nextNumber.toString().padStart(2, '0')}`;
};

export const clientesStorage = {
  getAll(): Cliente[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Cargar algunos clientes de ejemplo la primera vez
        this.initializeDefaultClientes();
        return this.getAll();
      }
      
      const clientes = JSON.parse(data);
      return clientes.map((c: any) => ({
        ...c,
        created_at: new Date(c.created_at)
      }));
    } catch (error) {
      console.error('Error loading clientes:', error);
      return [];
    }
  },

  getById(id: string): Cliente | null {
    return this.getAll().find(c => c.id === id) || null;
  },

  searchByName(query: string): Cliente[] {
    if (!query.trim()) return this.getAll();
    
    const searchTerm = query.toLowerCase();
    return this.getAll().filter(c => 
      c.nombre.toLowerCase().includes(searchTerm)
    );
  },

  save(cliente: Cliente): void {
    try {
      const clientes = this.getAll();
      const existingIndex = clientes.findIndex(c => c.id === cliente.id);
      
      // Si es un cliente nuevo, generar número de socio
      if (existingIndex < 0 && !cliente.numero_socio) {
        cliente.numero_socio = generateNumeroSocio();
      }
      
      if (existingIndex >= 0) {
        clientes[existingIndex] = cliente;
      } else {
        clientes.push(cliente);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    } catch (error) {
      console.error('Error saving cliente:', error);
      throw error;
    }
  },

  delete(id: string): void {
    try {
      const clientes = this.getAll().filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    } catch (error) {
      console.error('Error deleting cliente:', error);
      throw error;
    }
  },

  initializeDefaultClientes(): void {
    const defaultClientes: Cliente[] = [
      {
        id: 'default-1',
        numero_socio: '25-01',
        nombre: 'Juan Pérez',
        telefono: '341-555-0101',
        created_at: new Date()
      },
      {
        id: 'default-2',
        numero_socio: '25-02',
        nombre: 'María González',
        telefono: '341-555-0102',
        created_at: new Date()
      },
      {
        id: 'default-3',
        numero_socio: '25-03',
        nombre: 'Carlos López',
        telefono: '341-555-0103',
        created_at: new Date()
      },
      {
        id: 'default-4',
        numero_socio: '25-04',
        nombre: 'Ana Martínez',
        telefono: '341-555-0104',
        created_at: new Date()
      },
      {
        id: 'default-5',
        numero_socio: '25-05',
        nombre: 'Roberto Silva',
        telefono: '341-555-0105',
        created_at: new Date()
      }
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultClientes));
  }
};