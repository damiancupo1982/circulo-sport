import { CierreTurno, Reserva } from '../types';
import { reservasStorage } from '../storage/reservas';
import { cajaStorage } from '../storage/caja';
import { CANCHAS } from '../types';

export const cierreUtils = {
  generarCierre(usuario: string, fechaInicio: Date, fechaFin: Date): CierreTurno {
    // Obtener transacciones del período
    const todasTransacciones = cajaStorage.getAll();
    const transaccionesPeriodo = todasTransacciones.filter(t => {
      return t.fecha_hora >= fechaInicio && t.fecha_hora <= fechaFin;
    });

    // Obtener reservas relacionadas con las transacciones del período
    const reservaIds = transaccionesPeriodo
      .filter(t => t.reserva_id)
      .map(t => t.reserva_id);
    
    const todasReservas = reservasStorage.getAll();
    const reservasPeriodo = todasReservas.filter(r => 
      reservaIds.includes(r.id)
    );

    // Calcular totales por método de pago
    const totales = {
      efectivo: 0,
      transferencias: 0,
      expensas: 0, // Para futuras implementaciones
      total_general: 0
    };

    transaccionesPeriodo.forEach(t => {
      if (t.tipo === 'ingreso') {
        if (t.metodo_pago === 'efectivo') {
          totales.efectivo += t.monto;
        } else if (t.metodo_pago === 'transferencia') {
          totales.transferencias += t.monto;
        }
        totales.total_general += t.monto;
      } else if (t.tipo === 'retiro') {
        // Los retiros reducen el total de efectivo
        totales.efectivo -= t.monto;
        totales.total_general -= t.monto;
      }
    });

    // Generar detalle de transacciones
    const transaccionesDetalle = transaccionesPeriodo
      .filter(t => t.tipo === 'ingreso' && t.reserva_id)
      .map(t => {
        const reserva = todasReservas.find(r => r.id === t.reserva_id);
        if (!reserva) {
          return {
            fecha: t.fecha_hora.toISOString().split('T')[0],
            cliente_nombre: 'Cliente no encontrado',
            cancha: 'N/A',
            horario_desde: 'N/A',
            horario_hasta: 'N/A',
            importe: t.monto,
            metodo_pago: t.metodo_pago || 'N/A'
          };
        }
        
        const cancha = CANCHAS.find(c => c.id === reserva.cancha_id);
        return {
          fecha: reserva.fecha,
          cliente_nombre: reserva.cliente_nombre,
          cancha: cancha?.nombre || reserva.cancha_id,
          horario_desde: reserva.hora_inicio,
          horario_hasta: reserva.hora_fin,
          importe: t.monto,
          metodo_pago: t.metodo_pago || 'N/A'
        };
      });

    const duracionMinutos = Math.floor((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60));

    return {
      id: `cierre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      duracion_minutos: duracionMinutos,
      totales,
      cantidad_ventas: transaccionesDetalle.length,
      transacciones: transaccionesDetalle,
      reservas_detalle: reservasPeriodo,
      created_at: new Date()
    };
  },

  exportToPDF(cierre: CierreTurno): void {
    const content = this.generatePrintableContent(cierre);
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
          URL.revokeObjectURL(url);
        }, 1000);
      };
    }
  },

  exportToCSV(cierre: CierreTurno): void {
    const headers = [
      'Fecha',
      'Cliente',
      'Cancha',
      'Horario Desde',
      'Horario Hasta',
      'Importe',
      'Método de Pago'
    ];

    const rows = cierre.transacciones.map(t => [
      t.fecha,
      t.cliente_nombre,
      t.cancha,
      t.horario_desde,
      t.horario_hasta,
      t.importe.toString(),
      t.metodo_pago
    ]);

    const csvContent = [
      `Cierre de Turno - ${cierre.usuario}`,
      `Período: ${cierre.fecha_inicio.toLocaleString()} - ${cierre.fecha_fin.toLocaleString()}`,
      `Total Efectivo: $${cierre.totales.efectivo.toLocaleString()}`,
      `Total Transferencias: $${cierre.totales.transferencias.toLocaleString()}`,
      `Total General: $${cierre.totales.total_general.toLocaleString()}`,
      `Cantidad de Ventas: ${cierre.cantidad_ventas}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre_turno_${cierre.usuario}_${cierre.fecha_inicio.toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },

  generatePrintableContent(cierre: CierreTurno): string {
    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cierre de Turno - ${cierre.usuario}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .totales { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
          .total-row { font-weight: bold; background-color: #e5e7eb; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CÍRCULO SPORT</h1>
          <h2>Cierre de Turno</h2>
        </div>
        
        <div class="info-grid">
          <div>
            <h3>Información del Turno</h3>
            <p><strong>Usuario:</strong> ${cierre.usuario}</p>
            <p><strong>Fecha Inicio:</strong> ${cierre.fecha_inicio.toLocaleString('es-AR')}</p>
            <p><strong>Fecha Fin:</strong> ${cierre.fecha_fin.toLocaleString('es-AR')}</p>
            <p><strong>Duración:</strong> ${Math.floor(cierre.duracion_minutos / 60)}h ${cierre.duracion_minutos % 60}m</p>
          </div>
          
          <div class="totales">
            <h3>Resumen de Ventas</h3>
            <p><strong>Efectivo:</strong> ${formatCurrency(cierre.totales.efectivo)}</p>
            <p><strong>Transferencias:</strong> ${formatCurrency(cierre.totales.transferencias)}</p>
            <p><strong>Total General:</strong> ${formatCurrency(cierre.totales.total_general)}</p>
            <p><strong>Cantidad de Ventas:</strong> ${cierre.cantidad_ventas}</p>
          </div>
        </div>

        <h3>Detalle de Transacciones</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Cancha</th>
              <th>Horario</th>
              <th>Importe</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            ${cierre.transacciones.map(t => `
              <tr>
                <td>${t.fecha}</td>
                <td>${t.cliente_nombre}</td>
                <td>${t.cancha}</td>
                <td>${t.horario_desde} - ${t.horario_hasta}</td>
                <td>${formatCurrency(t.importe)}</td>
                <td>${t.metodo_pago}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4">TOTAL</td>
              <td>${formatCurrency(cierre.totales.total_general)}</td>
              <td>${cierre.cantidad_ventas} ventas</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          Generado el ${new Date().toLocaleString('es-AR')}
        </div>
      </body>
      </html>
    `;
  }
};