// Tipos y interfaces para el sistema de gestión

export interface Cliente {
  id: string;
  numero_socio: string;
  nombre: string;
  telefono: string;
  created_at: Date;
}

export interface Reserva {
  id: string;
  cancha_id: string;
  cliente_id: string;
  cliente_nombre: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  metodo_pago: 'efectivo' | 'transferencia' | 'pendiente';
  precio_base: number;
  extras: Extra[];
  items_libres: ItemLibre[];
  total: number;
  estado: 'confirmada' | 'cancelada';
  seña?: string; // Comentario sobre la seña
  created_at: Date;
}

export interface Extra {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface ItemLibre {
  id: string;
  descripcion: string;
  precio: number;
}

export interface Cancha {
  id: string;
  nombre: string;
  tipo: 'futbol-5' | 'futbol-8' | 'futbol-2' | 'padel';
  precio_base: number;
  color: string;
}

export interface TransaccionCaja {
  id: string;
  tipo: 'ingreso' | 'retiro';
  concepto: string;
  monto: number;
  fecha_hora: Date;
  reserva_id?: string;
  metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente';
}

export const CANCHAS: Cancha[] = [
  {
    id: 'futbol-5-1',
    nombre: 'Fútbol 5',
    tipo: 'futbol-5',
    precio_base: 8000,
    color: 'bg-blue-500'
  },
  {
    id: 'futbol-8-1',
    nombre: 'Fútbol 8',
    tipo: 'futbol-8',
    precio_base: 12000,
    color: 'bg-green-500'
  },
  {
    id: 'futbol-2-1',
    nombre: 'Fútbol 2',
    tipo: 'futbol-2',
    precio_base: 5000,
    color: 'bg-orange-500'
  },
  {
    id: 'padel-1',
    nombre: 'Pádel 1',
    tipo: 'padel',
    precio_base: 10000,
    color: 'bg-purple-500'
  },
  {
    id: 'padel-2',
    nombre: 'Pádel 2',
    tipo: 'padel',
    precio_base: 10000,
    color: 'bg-pink-500'
  }
];

export interface ExtraDisponible {
  id: string;
  nombre: string;
  precio: number;
}

export const HORARIOS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];