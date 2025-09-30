import { CierreTurno, Reserva } from '../types';
import { reservasStorage } from '../storage/reservas';
import { cajaStorage } from '../storage/caja';
import { CANCHAS } from '../types';

/** Helpers seguros */
function toDateSafe(v: any): Date {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date('Invalid') : d;
}
function n(x: any): number {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}
function fmtLocalDate(d: Date) {
  // fecha local legible YYYY-MM-DD (sin UTC shift visual)
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export const cierreUtils = {
  generarCierre(usuario: string, fechaInicio: Date, fechaFin: Date): CierreTurno {
    // 1) Transacciones normalizadas
    const todasTransacciones = (cajaStorage.getAll() || []).map((t: any) => ({
      ...t,
      fecha_hora: toDateSafe(t.fecha_hora),
      monto: n(t.monto),
    }));

    const ini = fechaInicio.getTime();
    const fin = fechaFin.getTime();

    // 2) Filtro inclusivo por rango (local-safe: trabajamos con Date reales)
    const transaccionesPeriodo = todasTransacciones.filter((t: any) => {
      const ts = t.fecha_hora.getTime();
      return Number.isFinite(ts) && ts >= ini && ts <= fin;
    });

    // 3) Reservas relacionadas
    const reservaIds = transaccionesPeriodo
      .filter((t: any) => !!t.reserva_id)
      .map((t: any) => t.reserva_id);

    const todasReservas: Reserva[] = reservasStorage.getAll() || [];
    const reservasPeriodo = todasReservas.filter((r: any) => reservaIds.includes(r.id));

    // 4) Totales por método
    const totales = {
      efectivo: 0,
      transferencias: 0,
      expensas: 0, // reservado por si lo activás luego
      total_general: 0,
    };

    transaccionesPeriodo.forEach((t: any) => {
      if (t.tipo === 'ingreso') {
        if (t.metodo_pago === 'efectivo') totales.efectivo += n(t.monto);
        else if (t.metodo_pago === 'transferencia') totales.transferencias += n(t.monto);
        else if (t.metodo_pago === 'expensa') totales.expensas += n(t.monto);
        totales.total_general += n(t.monto);
      } else if (t.tipo === 'retiro') {
        // Retiros siempre descuentan de efectivo
        totales.efectivo -= n(t.monto);
        totales.total_general -= n(t.monto);
      }
    });

    // 5) Detalle de transacciones (solo ingresos para "ventas")
    const transaccionesDetalle = transaccionesPeriodo
      .filter((t: any) => t.tipo === 'ingreso')
      .map((t: any) => {
        const fechaLocal = t.fecha_hora instanceof Date ? fmtLocalDate(t.fecha_hora) : 'N/A';

        if (t.reserva_id) {
          const r = todasReservas.find((rr: any) => rr.id === t.reserva_id);
          if (!r) {
            return {
              fecha: fechaLocal,
              cliente_nombre: t.cliente_nombre || 'Cliente no encontrado',
              cancha: 'N/A',
              horario_desde: 'N/A',
              horario_hasta: 'N/A',
              importe: n(t.monto),
              metodo_pago: (t.metodo_pago as string) || 'N/A',
            };
          }
          const cancha = CANCHAS.find(c => c.id === r.cancha_id);
          return {
            fecha: r.fecha || fechaLocal,
            cliente_nombre: r.cliente_nombre || t.cliente_nombre || 'Cliente',
            cancha: cancha?.nombre || r.cancha_id,
            horario_desde: r.hora_inicio || '',
            horario_hasta: r.hora_fin || '',
            importe: n(t.monto),
            metodo_pago: (t.metodo_pago as string) || 'N/A',
          };
        }

        // Ingreso manual
        return {
          fecha: fechaLocal,
          cliente_nombre: t.cliente_nombre || t.concepto || 'Ingreso',
          cancha: 'N/A',
          horario_desde: '',
          horario_hasta: '',
          importe: n(t.monto),
          metodo_pago: (t.metodo_pago as string) || 'N/A',
        };
      });

    const duracionMinutos = Math.max(
      0,
      Math.floor((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60))
    );

    const cierre: CierreTurno = {
      id: `cierre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario,
      fecha_inicio: new Date(fechaInicio),
      fecha_fin: new Date(fechaFin),
      duracion_minutos: duracionMinutos,
      totales: {
        efectivo: Math.round(totales.efectivo),
        transferencias: Math.round(totales.transferencias),
        expensas: Math.round(totales.expensas),
        total_general: Math.round(totales.total_general),
      },
      cantidad_ventas: transaccionesDetalle.length,
      transacciones: transaccionesDetalle,
      reservas_detalle: reservasPeriodo,
      created_at: new Date(),
    };

    return cierre;
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
      'Método de Pago',
    ];

    const rows = cierre.transacciones.map(t => [
      t.fecha,
      t.cliente_nombre,
      t.cancha,
      t.horario_desde,
      t.horario_hasta,
      t.importe.toString(),
      t.metodo_pago,
    ]);

    const csvContent = [
      `Cierre de Turno - ${cierre.usuario}`,
      `Período: ${cierre.fecha_inicio.toLocaleString('es-AR')} - ${cierre.fecha_fin.toLocaleString('es-AR')}`,
      `Total Efectivo: $${cierre.totales.efectivo.toLocaleString()}`,
      `Total Transferencias: $${cierre.totales.transferencias.toLocaleString()}`,
      `Total Expensas: $${cierre.totales.expensas.toLocaleString()}`,
      `Total General: $${cierre.totales.total_general.toLocaleString()}`,
      `Cantidad de Ventas: ${cierre.cantidad_ventas}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre_turno_${cierre.usuario}_${fmtLocalDate(cierre.fecha_inicio)}.csv`;
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
            <p><strong>Expensas:</strong> ${formatCurrency(cierre.totales.expensas)}</p>
            <p><strong>Total General:</strong> ${formatCurrency(cierre.totales.total_general)}</p>
            <p><strong>Cantidad de Ventas:</strong> ${cierre.cantidad_ventas}</p>
          </div>
        </div>

        <h3>Detalle de Transacciones</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente / Concepto</th>
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
                <td>${[t.horario_desde, t.horario_hasta].filter(Boolean).join(' - ')}</td>
                <td>${formatCurrency(t.importe)}</td>
                <td>${t.metodo_pago || ''}</td>
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
