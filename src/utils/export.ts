import { reservasStorage } from '../storage/reservas';
import { clientesStorage } from '../storage/clientes';
import { cajaStorage } from '../storage/caja';

export const exportUtils = {
  exportReservas(): void {
    const reservas = reservasStorage.getAll();
    
    const headers = [
      'ID',
      'Cancha',
      'Cliente',
      'Fecha',
      'Hora Inicio',
      'Hora Fin',
      'Método Pago',
      'Precio Base',
      'Extras',
      'Items Libres',
      'Total',
      'Estado',
      'Fecha Creación'
    ];

    const rows = reservas.map(r => [
      r.id,
      r.cancha_id,
      r.cliente_nombre,
      r.fecha,
      r.hora_inicio,
      r.hora_fin,
      r.metodo_pago,
      r.precio_base.toString(),
      r.extras.map(e => `${e.nombre}(${e.cantidad})`).join('; '),
      r.items_libres.map(i => i.descripcion).join('; '),
      r.total.toString(),
      r.estado,
      r.created_at.toISOString()
    ]);

    this.downloadCSV([headers, ...rows], 'reservas');
  },

  exportClientes(): void {
    const clientes = clientesStorage.getAll();
    
    const headers = ['ID', 'Nombre', 'Teléfono', 'Fecha Creación'];
    
    const rows = clientes.map(c => [
      c.id,
      c.nombre,
      c.telefono,
      c.created_at.toISOString()
    ]);

    this.downloadCSV([headers, ...rows], 'clientes');
  },

  exportTransacciones(): void {
    const transacciones = cajaStorage.getAll();
    
    const headers = [
      'ID',
      'Tipo',
      'Concepto',
      'Monto',
      'Fecha/Hora',
      'Reserva ID',
      'Método Pago'
    ];

    const rows = transacciones.map(t => [
      t.id,
      t.tipo,
      t.concepto,
      t.monto.toString(),
      t.fecha_hora.toISOString(),
      t.reserva_id || '',
      t.metodo_pago || ''
    ]);

    this.downloadCSV([headers, ...rows], 'transacciones');
  },

downloadCSV(data: string[][], filename: string): void {
    const csvContent = data
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};