import React, { useState } from 'react';
import { X, Printer, Download, FileText, DollarSign, Clock, Users, Calendar } from 'lucide-react';
import { CierreTurno } from '../types';
import { cierreUtils } from '../utils/cierreUtils';

interface CierreTurnoProps {
  cierre: CierreTurno;
  onClose: () => void;
  onExport?: (type: 'pdf' | 'csv') => void;
}

export const CierreTurnoModal: React.FC<CierreTurnoProps> = ({ cierre, onClose, onExport }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handlePrint = () => {
    const content = cierreUtils.generatePrintableContent(cierre);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleExportPDF = () => {
    cierreUtils.exportToPDF(cierre);
    onExport?.('pdf');
  };

  const handleExportCSV = () => {
    cierreUtils.exportToCSV(cierre);
    onExport?.('csv');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cierre de Turno</h2>
              <p className="text-gray-600">Usuario: {cierre.usuario}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="flex items-center px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center px-3 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-3 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Duración del Turno</p>
                  <p className="text-2xl font-semibold text-blue-900">{formatDuration(cierre.duracion_minutos)}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Total Recaudado</p>
                  <p className="text-2xl font-semibold text-green-900">{formatCurrency(cierre.totales.total_general)}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Cantidad de Ventas</p>
                  <p className="text-2xl font-semibold text-purple-900">{cierre.cantidad_ventas}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">Período</p>
                  <p className="text-sm font-semibold text-orange-900">
                    {cierre.fecha_inicio.toLocaleDateString('es-AR')}
                  </p>
                  <p className="text-xs text-orange-700">
                    {cierre.fecha_inicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - 
                    {cierre.fecha_fin.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💵 Efectivo</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(cierre.totales.efectivo)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏦 Transferencias</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(cierre.totales.transferencias)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Expensas</h3>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(cierre.totales.expensas)}</p>
            </div>
          </div>

          {/* Detalle de transacciones */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Detalle de Transacciones</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cierre.transacciones.map((transaccion, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaccion.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaccion.cliente_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaccion.cancha}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaccion.horario_desde} - {transaccion.horario_hasta}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaccion.importe)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaccion.metodo_pago === 'efectivo' 
                            ? 'bg-green-100 text-green-800'
                            : transaccion.metodo_pago === 'transferencia'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaccion.metodo_pago}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Fila de totales */}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(cierre.totales.total_general)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{cierre.cantidad_ventas} ventas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
            Generado el {cierre.created_at.toLocaleString('es-AR')}
          </div>
        </div>
      </div>
    </div>
  );
};