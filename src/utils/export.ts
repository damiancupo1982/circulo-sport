import { reservasStorage } from '../storage/reservas';
import { clientesStorage } from '../storage/clientes';
import { cajaStorage } from '../storage/caja';
import { Reserva, TransaccionCaja } from '../types';

function toCSVRow(values: (string | number | null | undefined)[]) {
  return values
    .map(v => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      // envolver en comillas si contiene coma, comillas o salto de línea
      return /[",\n]/.test(s) ? `"${s}"` : s;
    })
    .join(',');
}

function downloadCSV(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [toCSVRow(header), ...rows.map(toCSVRow)].join('\n');
  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function tipoMovimiento(t: TransaccionCaja) {
  if (t.tipo === 'retiro') return 'RETIRO';
  if (t.tipo === 'ingreso') {
    const concepto = (t.concepto || '').toLowerCase();
    if (concepto.startsWith('seña')) return 'SEÑA';
    if (t.reserva_id) return 'SALDO';
    return 'MANUAL';
  }
  return 'OTRO';
}

export const exportUtils = {
  exportReservas() {
    const reservas = reservasStorage.getAll() as Reserva[];

    const header = [
      'id', 'fecha', 'hora_inicio', 'hora_fin',
      'cancha_id', 'cliente_id', 'cliente_nombre',
      'metodo_pago', 'estado', 'precio_base', 'total',
      'seña_texto', 'seña_monto', 'seña_metodo', 'seña_aplica_caja',
      'extras_json', 'items_libres_json', 'created_at'
    ];

    const rows = reservas.map(r => [
      r.id,
      r.fecha,
      r.hora_inicio,
      r.hora_fin,
      r.cancha_id,
      r.cliente_id,
      r.cliente_nombre,
      r.metodo_pago,
      r.estado,
      r.precio_base,
      r.total,
      r.seña || '',
      r.seña_monto ?? 0,
      r.seña_metodo || '',
      r.seña_aplica_caja === false ? 'false' : 'true',
      JSON.stringify(r.extras || []),
      JSON.stringify(r.items_libres || []),
      r.created_at ? new Date(r.created_at).toISOString() : ''
    ]);

    const filename = `reservas_${formatDate(new Date())}.csv`;
    downloadCSV(filename, header, rows);
  },

  exportClientes() {
    const clientes = clientesStorage.getAll();
    const header = ['id', 'numero_socio', 'nombre', 'telefono', 'created_at'];
    const rows = clientes.map(c => [
      c.id, c.numero_socio, c.nombre, c.telefono,
      c.created_at ? new Date(c.created_at).toISOString() : ''
    ]);
    const filename = `clientes_${formatDate(new Date())}.csv`;
    downloadCSV(filename, header, rows);
  },

  exportTransacciones() {
    const trans = cajaStorage.getAll();
    const header = [
      'id', 'tipo', 'tipo_movimiento', 'concepto', 'monto',
      'metodo_pago', 'fecha', 'hora', 'reserva_id'
    ];

    const rows = trans.map(t => {
      const fecha = new Date(t.fecha_hora);
      return [
        t.id,
        t.tipo,
        tipoMovimiento(t),
        t.concepto,
        t.monto,
        t.metodo_pago || '',
        formatDate(fecha),
        fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        t.reserva_id || ''
      ];
    });

    const filename = `transacciones_${formatDate(new Date())}.csv`;
    downloadCSV(filename, header, rows);
  }
};
