import React, { useState, useEffect } from 'react';
import { Search, Calendar, Eye, Printer, Download, FileText, Filter } from 'lucide-react';
import { CierreTurno } from '../types';
import { cierresStorage } from '../storage/cierres';
import { CierreTurnoModal } from './CierreTurno';

export const ConsultaCierres: React.FC = () => {
  const [cierres, setCierres] = useState<CierreTurno[]>([]);
  const [filteredCierres, setFilteredCierres] = useState<CierreTurno[]>([]);
  const [selectedCierre, setSelectedCierre] = useState<CierreTurno | null>(null);
  
  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  useEffect(() => {
    loadCierres();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cierres, filtroUsuario, filtroFechaDesde, filtroFechaHasta]);

  const loadCierres = () => {
    const allCierres = cierresStorage.getAll();
    setCierres(allCierres.sort((a, b) => b.fecha_inicio.getTime() - a.fecha_inicio.getTime()));
  };

  const applyFilters = () => {
    let filtered = [...cierres];

    // Filtro por usuario
    if (filtroUsuario.trim()) {
      filtered = filtered.filter(c => 
        c.usuario.toLowerCase().includes(filtroUsuario.toLowerCase())
      );
    }

    // Filtro por rango de fechas
    if (filtroFechaDesde) {
      const fechaDesde = new Date(filtroFechaDesde + 'T00:00:00');
      filtered = filtered.filter(c => c.fecha_inicio >= fechaDesde);
    }

    if (filtroFechaHasta) {
      const fechaHasta = new Date(filtroFechaHasta + 'T23:59:59');
      filtered = filtered.filter(c => c.fecha_inicio <= fechaHasta);
    }

    setFilteredCierres(filtered);
  };

  const clearFilters = () => {
    setFiltroUsuario('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Consulta de Cierres Anteriores</h2>
        <button
          onClick={clearFilters}
          className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4 mr-2" />
          Limpiar Filtros
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Filtrar por Usuario
            </label>
            <input
              type="text"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              placeholder="Nombre del usuario..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Hasta
            </label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Resultados ({filteredCierres.length} cierres encontrados)
          </h3>
        </div>

        {filteredCierres.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cierres</h3>
            <p className="text-gray-500">
              {cierres.length === 0 
                ? 'No hay cierres de turno registrados aún.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Recaudado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCierres.map((cierre) => (
                  <tr key={cierre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cierre.usuario}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cierre.fecha_inicio.toLocaleDateString('es-AR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cierre.fecha_inicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - 
                        {cierre.fecha_fin.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(cierre.duracion_minutos)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cierre.cantidad_ventas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(cierre.totales.total_general)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Ef: {formatCurrency(cierre.totales.efectivo)} | 
                        Tr: {formatCurrency(cierre.totales.transferencias)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCierre(cierre)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedCierre && (
        <CierreTurnoModal
          cierre={selectedCierre}
          onClose={() => setSelectedCierre(null)}
          onExport={(type) => {
            console.log(`Exportando ${type} para cierre ${selectedCierre.id}`);
          }}
        />
      )}
    </div>
  );
};