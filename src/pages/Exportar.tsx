import React, { useState } from 'react';
import { Download, FileText, Users, DollarSign, Calendar, Settings, X } from 'lucide-react';
import { exportUtils } from '../utils/export';
import { reservasStorage } from '../storage/reservas';
import { clientesStorage } from '../storage/clientes';
import { cajaStorage } from '../storage/caja';
import { extrasStorage } from '../storage/extras';
import { ExtraDisponible } from '../types';

export const Exportar: React.FC = () => {
  const [exportando, setExportando] = useState<string | null>(null);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [extrasDisponibles, setExtrasDisponibles] = useState<ExtraDisponible[]>([]);
  const [editingExtra, setEditingExtra] = useState<ExtraDisponible | null>(null);

  React.useEffect(() => {
    setExtrasDisponibles(extrasStorage.getAll());
  }, []);

  const handleExport = async (tipo: 'reservas' | 'clientes' | 'transacciones') => {
    setExportando(tipo);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      switch (tipo) {
        case 'reservas':
          exportUtils.exportReservas(); // incluye columnas de seña
          break;
        case 'clientes':
          exportUtils.exportClientes();
          break;
        case 'transacciones':
          exportUtils.exportTransacciones(); // marca SEÑA / SALDO por concepto
          break;
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos. Intenta nuevamente.');
    } finally {
      setExportando(null);
    }
  };

  const handleSaveExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const extra: ExtraDisponible = {
      id: editingExtra?.id || `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: (formData.get('nombre') as string).trim(),
      precio: Number(formData.get('precio'))
    };

    if (!extra.nombre) {
      alert('El nombre del extra es obligatorio.');
      return;
    }

    extrasStorage.save(extra);
    setExtrasDisponibles(extrasStorage.getAll());
    setEditingExtra(null);
  };

  const handleDeleteExtra = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este extra?')) {
      extrasStorage.delete(id);
      setExtrasDisponibles(extrasStorage.getAll());
    }
  };

  const estadisticas = {
    reservas: reservasStorage.getAll().length,
    clientes: clientesStorage.getAll().length,
    transacciones: cajaStorage.getAll().length,
    totalCaja: cajaStorage.getTotalCaja()
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exportar Datos</h1>
        <button
          onClick={() => setShowExtrasModal(true)}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurar Extras
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reservas</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticas.reservas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticas.clientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transacciones</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticas.transacciones}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total en Caja</p>
              <p className="text-2xl font-semibold text-purple-600">{formatCurrency(estadisticas.totalCaja)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exportes */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Exportar Archivos CSV</h2>
            <p className="text-gray-600 mt-1">Descargá tus datos en CSV (UTF-8, separado por comas).</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Reservas */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Reservas</h3>
                  <p className="text-sm text-gray-600">Incluye seña_monto, seña_metodo y seña_aplica_caja</p>
                </div>
              </div>
              <button
                onClick={() => handleExport('reservas')}
                disabled={exportando === 'reservas' || estadisticas.reservas === 0}
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportando === 'reservas' ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>

            {/* Clientes */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Clientes</h3>
                </div>
              </div>
              <button
                onClick={() => handleExport('clientes')}
                disabled={exportando === 'clientes' || estadisticas.clientes === 0}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportando === 'clientes' ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>

            {/* Transacciones */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Transacciones</h3>
                  <p className="text-sm text-gray-600">Agrega columna tipo_movimiento (SEÑA / SALDO / MANUAL / RETIRO)</p>
                </div>
              </div>
              <button
                onClick={() => handleExport('transacciones')}
                disabled={exportando === 'transacciones' || estadisticas.transacciones === 0}
                className="flex items-center px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportando === 'transacciones' ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Info CSV */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-blue-900">Formato de los CSV</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• Fechas ISO (YYYY-MM-DD) y horas localizadas</p>
                <p>• UTF-8, separado por comas</p>
                <p>• Reservas: incluye seña_monto, seña_metodo, seña_aplica_caja</p>
                <p>• Transacciones: incluye tipo_movimiento (SEÑA / SALDO / MANUAL / RETIRO)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Extras */}
      {showExtrasModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowExtrasModal(false)} />
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Configurar Extras</h3>
                <button onClick={() => setShowExtrasModal(false)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <form onSubmit={handleSaveExtra} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">{editingExtra ? 'Editar Extra' : 'Nuevo Extra'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre del extra"
                      defaultValue={editingExtra?.nombre || ''}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="number"
                      name="precio"
                      placeholder="Precio"
                      defaultValue={editingExtra?.precio || ''}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    {editingExtra && (
                      <button
                        type="button"
                        onClick={() => setEditingExtra(null)}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                    <button type="submit" className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700">
                      {editingExtra ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Extras Disponibles</h4>
                  {extrasDisponibles.map(extra => (
                    <div key={extra.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <span className="font-medium">{extra.nombre}</span>
                        <span className="ml-2 text-gray-600">${extra.precio}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingExtra(extra)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">
                          Editar
                        </button>
                        <button onClick={() => handleDeleteExtra(extra.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
