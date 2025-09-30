// src/components/ConsultaCierres.tsx
import React, { useMemo, useState } from 'react';
import { Trash2, Search, FileText, FileDown } from 'lucide-react';
import { CierreTurno } from '../types';
import { cierresStorage } from '../storage/cierres';
import { cierreUtils } from '../utils/cierreUtils';

const ConsultaCierres: React.FC = () => {
  const [query, setQuery] = useState('');

  const cierres = useMemo<CierreTurno[]>(() => {
    try {
      const all = cierresStorage.getAll() || [];
      // orden más reciente primero
      return [...all].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }, [/* no deps: leer solo al montar, si querés refresco, hacelo lifting en padre */]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cierres;
    return cierres.filter(c =>
      c.usuario.toLowerCase().includes(q) ||
      new Date(c.fecha_inicio).toLocaleDateString('es-AR').includes(q) ||
      new Date(c.fecha_fin).toLocaleDateString('es-AR').includes(q)
    );
  }, [query, cierres]);

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este cierre? Esta acción no se puede deshacer.')) return;
    cierresStorage.delete(id);
    // Fuerza recarga simple: location.reload para mantenerlo stateless
    location.reload();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario o fecha..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
              <th className="text-left p-3 font-medium text-gray-600">Usuario</th>
              <th className="text-left p-3 font-medium text-gray-600">Período</th>
              <th className="text-left p-3 font-medium text-gray-600">Total</th>
              <th className="text-left p-3 font-medium text-gray-600">Ventas</th>
              <th className="text-left p-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="p-3 text-gray-500" colSpan={6}>No hay cierres.</td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{new Date(c.created_at).toLocaleString('es-AR')}</td>
                <td className="p-3">{c.usuario}</td>
                <td className="p-3">
                  {new Date(c.fecha_inicio).toLocaleString('es-AR')} — {new Date(c.fecha_fin).toLocaleString('es-AR')}
                </td>
                <td className="p-3">{formatCurrency(c.totales.total_general)}</td>
                <td className="p-3">{c.cantidad_ventas}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
                      onClick={() => cierreUtils.exportToCSV(c)}
                      title="Exportar CSV"
                    >
                      <FileText className="w-4 h-4" /> CSV
                    </button>
                    <button
                      className="px-2 py-1 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                      onClick={() => cierreUtils.exportToPDF(c)}
                      title="Exportar PDF"
                    >
                      <FileDown className="w-4 h-4" /> PDF
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 text-red-600 flex items-center gap-1"
                      onClick={() => handleDelete(c.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ✅ Default export (y también podrías agregar named si lo necesitás)
export default ConsultaCierres;
