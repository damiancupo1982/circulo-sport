// -------- Transacciones de Caja --------
export interface TransaccionCaja {
  id: string;
  tipo: 'ingreso' | 'retiro';
  concepto: string;
  monto: number;
  fecha_hora: Date; // SIEMPRE Date al cargar
  reserva_id?: string;
  metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente';
}

// -------- Reservas --------
export interface Reserva {
  id: string;
  cliente_nombre: string;
  cancha_id: string;
  fecha: string;        // "YYYY-MM-DD"
  hora_inicio: string;  // "HH:MM"
  hora_fin: string;     // "HH:MM"
}

// -------- Canchas --------
export interface Cancha {
  id: string;
  nombre: string;
}

export const CANCHAS: Cancha[] = [
  { id: '1', nombre: 'Cancha 1' },
  { id: '2', nombre: 'Cancha 2' },
  { id: '3', nombre: 'Cancha 3' },
];

// -------- Cierre de Turno --------
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
