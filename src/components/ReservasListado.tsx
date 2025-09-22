import React, { useMemo, useState } from 'react';
import { Calendar, Filter, Download } from 'lucide-react';
import { Reserva, CANCHAS } from '../types';
import { reservasStorage } from '../storage/reservas';
import { exportUtils } from '../utils/export';

type FiltroTipo = 'todas' | 'dia' | 'semana' | 'mes' | 'rango';

function formatDateISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo
  const diff = (day + 6) % 7; // lunes como inicio
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toComparableDateTime(reserva: Reserva): Date {
  // Comparamos con fin de la reserva (fecha + hora_fin)
  return new Date(`${reserva.fecha}T${(reserva.hora_fin || '23:59')}:00`);
}

export const ReservasListado: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todas');
  const [referencia, setReferencia] = useState<string>(formatDateISO(new Date())); // para día/semana/mes
  const [desde, setDesde] = useState<string>(''); // para rango
  const [hasta, setHasta] = useState<string>('');

  const todas = useMemo(() => reservasStorage.getAll(), []);
  const ahora = new Date();

  const filtradas = useMemo(() => {
    if (filtroTipo === 'todas') {
      return [...todas].sort((a, b) =>
        (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio)
      );
    }

    if (filtroTipo === 'dia') {
      return todas
        .filter((r) => r.fecha === referencia)
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }

    if (filtroTipo === 'semana') {
      const ref = new Date(referencia + 'T00:00:00');
      const ini = startOfWeek(ref);
      const fin = endOfWeek(ref);
      return todas
        .filter((r) => {
          const d = new Date(r.fecha + 'T12:00:00');
          return d >= ini && d <= fin;
        })
        .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
    }

    if (filtroTipo === 'mes') {
      const ref = new Date(referencia + 'T00:00:00');
      const ini = startOfMonth(ref);
      const fin = endOfMonth(ref);
      return todas
        .filter((r) => {
          const d = new Date(r.fecha + 'T12:00:00');
          return d >= ini && d <= fin;
        })
        .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
    }

    // rango
    const dIni = desde ? new Date(desde + 'T00:00:00') : null;
    const dFin = hasta ? new Date(hasta + 'T23:59:59') : null;
    return todas
      .filter((r) => {
        const d = new Date(r.fecha + 'T12:00:00');
        if (dIni && d < dIni) return false;
        if (dFin && d > dFin) return false;
        return true;
      })
      .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio));
  }, [todas, filtroTipo, referencia, desde, hasta]);

  const exportar = () => {
    const etiqueta =
      filtroTipo === 'todas'
        ? 'todas'
        : filtroTipo === 'dia'
        ? `dia_${referencia}`
        : filtroTipo === 'semana'
        ? `semana_${referencia}`
        : filtroTipo === 'mes'
        ? `mes_${referencia.slice(0, 7)}`
        : `rango_${desde || 'inicio'}_a_${hasta || 'fin'}`;
    exportUtils.exportReservasCustom(filtradas, `_${etiqueta}`);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Listado de todas las reservas</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportar}
            className="flex items-center px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            title="Exportar listado filtrado a CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar lista
          </button>
        </div>
      </div>

      {/* Controles de filtro */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtro</label>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="todas">Todas</option>
                <option value="dia">Por día</option>
                <option value="semana">Por semana (desde fecha)</option>
                <option value="mes">Por mes (de la fecha)</option>
                <option value="rango">Rango de fechas</option>
              </select>
            </div>
          </div>

          {(filtroTipo === 'dia' || filtroTipo === 'semana' || filtroTipo === 'mes') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filtroTipo === 'dia'
                  ? 'Día'
                  : filtroTipo === 'semana'
                  ? 'Fecha de referencia'
                  : 'Fecha dentro del mes'}
              </label>
              <input
                type="date"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {filtroTipo === 'rango' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-700 bg-gray-50">
              <th className="p-2">Fecha</th>
              <th className="p-2">Hora</th>
              <th className="p-2">Cancha</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Método</th>
              <th className="p-2">Estado</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No hay reservas para este filtro.
                </td>
              </tr>
            )}
            {filtradas.map((r) => {
              const cancha = CANCHAS.find((c) => c.id === r.cancha_id);
              const esPasada = toComparableDateTime(r) < ahora;
              const rowClass = esPasada ? 'bg-gray-50' : 'bg-green-50';
              const estadoBadge =
                r.metodo_pago === 'pendiente' ? (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-200 text-yellow-900 border border-yellow-300">
                    Pendiente
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-200 text-green-900 border border-green-300">
                    Pagada
                  </span>
                );
              return (
                <tr key={r.id} className={`${rowClass} border-b border-gray-100`}>
                  <td className="p-2 whitespace-nowrap">{r.fecha}</td>
                  <td className="p-2 whitespace-nowrap">
                    {r.hora_inicio} - {r.hora_fin}
                  </td>
                  <td className="p-2 whitespace-nowrap">{cancha?.nombre || r.cancha_id}</td>
                  <td className="p-2 whitespace-nowrap">{r.cliente_nombre}</td>
                  <td className="p-2 whitespace-nowrap capitalize">{r.metodo_pago}</td>
                  <td className="p-2 whitespace-nowrap">{estadoBadge}</td>
                  <td className="p-2 whitespace-nowrap text-right">${r.total.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 text-xs text-gray-500 border-t">
        <p>
          <strong>Colores:</strong>{' '}
          <span className="px-1 rounded bg-green-50 border border-green-200">futuras</span> /{' '}
          <span className="px-1 rounded bg-gray-50 border border-gray-200">pasadas</span>
        </p>
      </div>
    </div>
  );
};
