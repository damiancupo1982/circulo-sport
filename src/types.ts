// src/types.ts

// ---- Tipos base ----
export type MetodoPago = 'efectivo' | 'transferencia' | 'pendiente' | 'expensa';

export interface TransaccionCaja {
  id: string;
  tipo: 'ingreso' | 'retiro';
  concepto: string;
  monto: number;
  fecha_hora: Date;            // siempre Date al cargar desde storage
  reserva_id?: string;
  metodo_pago?: MetodoPago;
  cliente_nombre?: string;     // opcional si alguna vez lo guardás
}

export interface Reserva {
  id: string;
  cliente_nombre: string;
  cancha_id: string;
  fecha: string;        // "YYYY-MM-DD"
  hora_inicio: string;  // "HH:mm"
  hora_fin: string;     // "HH:mm"
}

export interface Cancha {
  id: string;
  nombre: string;
}

// ---- Catálogo de canchas (podés editarlo a gusto) ----
export const CANCHAS: Cancha[] = [
  { id: '1', nombre: 'Cancha 1' },
  { id: '2', nombre: 'Cancha 2' },
  { id: '3', nombre: 'Cancha 3' },
];

// ---- HORARIOS_DISPONIBLES (30 min de 08:00 a 23:30) ----
export const HORARIOS_DISPONIBLES: string[] = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30',
  '20:00','20:30','21:00','21:30','22:00','22:30','23:00','23:30'
];

// ---- Cierre de turno ----
export interface CierreTurno {
  id: string;
  usuario: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  duracion_minutos: number;
  totales: {
    efectivo: number;
    transferencias: number;
    expensas: number;
    total_general: number;
  };
  cantidad_ventas: number;
  transacciones: Array<{
    fecha: string;
    cliente_nombre: string;
    cancha: string;
    horario_desde: string;
    horario_hasta: string;
    importe: number;
    metodo_pago: string;
  }>;
  reservas_detalle: Reserva[];
  created_at: Date;
}
