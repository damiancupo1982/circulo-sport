// src/pages/Exportar.tsx
import React, { useState } from 'react';
import { Download, FileText, Users, DollarSign, Calendar, Settings, X, HardDriveDownload, HardDriveUpload, FolderOpen } from 'lucide-react';
import { exportUtils } from '../utils/export';
import { reservasStorage } from '../storage/reservas';
import { clientesStorage } from '../storage/clientes';
import { cajaStorage } from '../storage/caja';
import { extrasStorage } from '../storage/extras';
import { ExtraDisponible } from '../types';
import { createBackup, importBackupFile, getBackupSettings, setBackupSettings, shouldRemindNow } from '../utils/backup';

export const Exportar: React.FC = () => {
  const [exportando, setExportando] = useState<string | null>(null);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [extrasDisponibles, setExtrasDisponibles] = useState<ExtraDisponible[]>([]);
  const [editingExtra, setEditingExtra] = useState<ExtraDisponible | null>(null);

  // Backup state
  const [preferFS, setPreferFS] = useState<boolean>(true); // intentar File System Access
  const [rangoDesde, setRangoDesde] = useState<string>(''); // YYYY-MM-DD
  const [rangoHasta, setRangoHasta] = useState<string>('');
  const [importBusy, setImportBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupEveryDays, setBackupEveryDays] = useState<number>(getBackupSettings().remindEveryDays);
  const [reminderVisible, setReminderVisible] = useState<boolean>(shouldRemindNow());

  React.useEffect(() => {
    setExtrasDisponibles(extrasStorage.getAll());
  }, []);

  const handleExport = async (tipo: 'reservas' | 'clientes' | 'transacciones') => {
    setExportando(tipo);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      switch (tipo) {
        case 'reservas':
          exportUtils.exportReservas();
          break;
        case 'clientes':
          exportUtils.exportClientes();
          break;
        case 'transacciones':
          exportUtils.exportTransacciones();
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

  // ==== BACKUP ====
  const doBackup = async () => {
    setBackupBusy(true);
    try {
      const rango = (rangoDesde || rangoHasta) ? { desde: rangoDesde || undefined, hasta: rangoHasta || undefined } : undefined;
      const res = await createBackup({ rango, preferFS });
      if (res.ok) {
        if (res?.fallback) alert('Guardado con descarga estándar. Para guardar en carpeta, usá Chrome/Edge con permisos.');
        if (reminderVisible) setReminderVisible(false);
      } else {
        alert('No se pudo crear el backup: ' + (res as any).error);
      }
    } finally {
      setBackupBusy(false);
    }
  };

  const onChangeReminderDays = (n: number) => {
    const v = Math.max(0, Math.floor(n || 0));
    setBackupEveryDays(v);
    const s = getBackupSettings();
    s.remindEveryDays = v;
    setBackupSettings(s);
  };

  const doImport = async (file: File | null) => {
    if (!file) return;
    if (!confirm('Vas a REEMPLAZAR todos los datos locales con el backup seleccionado. ¿Continuar?')) return;
    setImportBusy(true);
    try {
      const res = await importBackupFile(file, 'replace');
      if (res.ok) {
        alert('Datos importados correctamente. Recargá la página para ver los cambios.');
      } else {
        alert('Error al importar: ' + res.error);
      }
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exportar / Backup</h1>
        <button
          onClick={() => setShowExtrasModal(true)}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurar Extras
        </button>
      </div>

      {/* Recordatorio de backup */}
      {reminderVisible && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDriveDownload className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-amber-900 font-medium">Te recomendamos hacer un backup ahora.</p>
              <p className="text-amber-800 text-sm">Podés configurarlo abajo para que te recuerde cada N días.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={doBackup} disabled={backupBusy} className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
              Hacer backup ahora
            </button>
            <button onClick={() => setReminderVisible(false)} className="p-2 hover:bg-amber-100 rounded-lg">
              <X className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>
      )}

      {/* Resumen de datos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg"><Calendar className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reservas</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticas.reservas}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticas.clientes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg"><FileText className="w-6 h-6 text-orange-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transacciones</p>
              <p className="text-2xl font-semibold text-gray-900">{estadisticas.transacciones}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg"><DollarSign className="w-6 h-6 text-purple-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total en Caja</p>
              <p className="text-2xl font-semibold text-purple-600">{formatCurrency(estadisticas.totalCaja)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export CSV (tu sección existente) */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Exportar Archivos CSV</h2>
            <p className="text-gray-600 mt-1">Descargá tus datos en CSV (UTF-8, separado por comas).</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg"><Calendar className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Reservas</h3>
                  <p className="text-sm text-gray-600">Incluye columnas de seña</p>
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

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
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

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-lg"><DollarSign className="w-6 h-6 text-orange-600" /></div>
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Transacciones</h3>
                  <p className="text-sm text-gray-600">Incluye tipo_movimiento (SEÑA / SALDO / MANUAL / RETIRO)</p>
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
      </div>

      {/* ===== NUEVA SECCIÓN: BACKUP / RESTAURAR ===== */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Backup / Restaurar</h2>
          <p className="text-gray-600 mt-1">
            Generá un único archivo <code>.json</code> con todos los datos. Podés filtrar por rango (aplica a Reservas y Caja). Ese archivo
            lo podés subir a tu nube y luego importarlo en otra PC para ver los mismos datos.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde (opcional)</label>
              <input type="date" value={rangoDesde} onChange={e => setRangoDesde(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta (opcional)</label>
              <input type="date" value={rangoHasta} onChange={e => setRangoHasta(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={preferFS} onChange={e => setPreferFS(e.target.checked)} />
                <span className="text-sm text-gray-700">Elegir carpeta (si el navegador lo permite)</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={doBackup}
              disabled={backupBusy}
              className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <HardDriveDownload className="w-4 h-4 mr-2" />
              {backupBusy ? 'Generando...' : 'Generar Backup (.json)'}
            </button>

            <label className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 cursor-pointer">
              <HardDriveUpload className="w-4 h-4 mr-2" />
              {importBusy ? 'Importando...' : 'Importar Backup (.json)'}
              <input
                type="file"
                accept="application/json"
                className="hidden"
                disabled={importBusy}
                onChange={e => doImport(e.target.files?.[0] || null)}
              />
            </label>

            <a
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API"
              target="_blank" rel="noreferrer"
              title="Compatibilidad del API de archivos"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Compatibilidad (ayuda)
            </a>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-2">Recordatorio de backup</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Recordarme cada</span>
              <input
                type="number"
                min={0}
                value={backupEveryDays}
                onChange={e => onChangeReminderDays(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <span className="text-sm text-gray-700">días (0 = desactivar)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              El recordatorio funciona mientras la app está abierta. Para automatizar totalmente en segundo plano, haría falta un
              proceso del sistema (no posible desde un sitio web).
            </p>
          </div>
        </div>
      </div>

      {/* Modal Extras (sin cambios salvo import de X) */}
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
                    <input type="text" name="nombre" placeholder="Nombre del extra" defaultValue={editingExtra?.nombre || ''} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                    <input type="number" name="precio" placeholder="Precio" defaultValue={editingExtra?.precio || ''} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" min="0" required />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    {editingExtra && (
                      <button type="button" onClick={() => setEditingExtra(null)} className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
                    )}
                    <button type="submit" className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700">{editingExtra ? 'Actualizar' : 'Agregar'}</button>
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
                        <button onClick={() => setEditingExtra(extra)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">Editar</button>
                        <button onClick={() => handleDeleteExtra(extra.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded">Eliminar</button>
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
