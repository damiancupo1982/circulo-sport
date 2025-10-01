import React from 'react';
import { X, FileDown, FileText } from 'lucide-react';
import { CierreTurno } from '../types';
import { cierreUtils } from '../utils/cierreUtils';

type Props = {
  cierre: CierreTurno;
  onClose: () => void;
  onExport?: (type: 'pdf' | 'csv') => void;
};

const CierreTurnoModal: React.FC<Props> = ({ cierre, onClose, onExport }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const handleExportPDF = () => { cierreUtils.exportToPDF(cierre); onExport?.('pdf'); };
  const handleExportCSV = () => { cierreUtils.exportToCSV(cierre); onExport?.('csv'); };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Cierre de turno</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Información</h4>
                <p><span className="text-gray-600">Usuario:</span> <strong>{cierre.usuario}</strong></p>
                <p><span className="text-gray-600">Inicio:</span> {new Date(cierre.fecha_inicio).toLocaleString('es-AR')}</p>
                <p><span className="text-gray-600">Fin:</span> {new Date(cierre.fecha_fin).toLocaleString('es-AR')}</p>
                <p><span className="text-gray-600">Duración:</span> {Math.floor(cierre.duracion_minutos / 60)}h {cierre.duracion_minutos % 60}m</p>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-medium text-gray-900 mb-2">Totales</h4>
                <ul className="space-y-1">
                  <li><span className="text-gray-600">Efectivo:</span> <strong className="text-green-700">{formatCurrency(cierre.totales.efectivo)}</strong></li>
                  <li><span className="text-gray-600">Transferencias:</span> <strong className="text-blue-700">{formatCurrency(cierre.totales.transferencias)}</strong></li>
                  <li><span className="text-gray-600">Expensas:</span> <strong>{formatCurrency(cierre.totales.expensas)}</strong></li>
                  <li className="border-t pt-2"><span className="text-gray-600">Total General:</span> <strong className="text-gray-900">{formatCurrency(cierre.totales.total_general)}</strong></li>
                  <li><span className="text-gray-600">Cantidad de ventas:</span> <strong>{cierre.cantidad_ventas}</strong></li>
                </ul>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h4 className="font-medium text-gray-900">Detalle de transacciones</h4>
              </div>
              <div className="max-h-[50vh] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                      <th className="text-left p-3 font-medium text-gray-600">Cliente / Concepto</th>
                      <th className="text-left p-3 font-medium text-gray-600">Cancha</th>
                      <th className="text-left p-3 font-medium text-gray-600">Horario</th>
                      <th className="text-left p-3 font-medium text-gray-600">Importe</th>
                      <th className="text-left p-3 font-medium text-gray-600">Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierre.transacciones.map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3">{t.fecha}</td>
                        <td className="p-3">{t.cliente_nombre}</td>
                        <td className="p-3">{t.cancha}</td>
                        <td className="p-3">{[t.horario_desde, t.horario_hasta].filter(Boolean).join(' - ')}</td>
                        <td className="p-3">{formatCurrency(t.importe)}</td>
                        <td className="p-3">{t.metodo_pago}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="p-3" colSpan={4}>TOTAL</td>
                      <td className="p-3">{formatCurrency(cierre.totales.total_general)}</td>
                      <td className="p-3">{cierre.cantidad_ventas} ventas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-3">
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50" title="Exportar CSV">
                <FileText className="w-4 h-4" /> Exportar CSV
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700" title="Exportar PDF">
                <FileDown className="w-4 h-4" /> Exportar PDF
              </button>
              <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Exports
export { CierreTurnoModal };      // named
export default CierreTurnoModal;  // default
