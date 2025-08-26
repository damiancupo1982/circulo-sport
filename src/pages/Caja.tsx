import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Minus, CreditCard, Banknote, Lock, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { TransaccionCaja } from '../types';
import { cajaStorage } from '../storage/caja';
import { dateUtils } from '../utils/dates';

export const Caja: React.FC = () => {
  const [transacciones, setTransacciones] = useState<TransaccionCaja[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoRetiro, setTipoRetiro] = useState<'retiro' | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [totales, setTotales] = useState({
    totalCaja: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    ingresosDia: 0,
    ingresosEfectivoDia: 0,
    ingresosTransferenciaDia: 0,
    retirosDia: 0
  });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const dateString = dateUtils.formatDate(selectedDate);
      const transaccionesDia = cajaStorage.getByDate(dateString);
      
      setTransacciones(transaccionesDia);
      setTotales({
        totalCaja: cajaStorage.getTotalCaja(),
        totalEfectivo: cajaStorage.getTotalEfectivo(),
        totalTransferencia: cajaStorage.getTotalTransferencia(),
        ingresosDia: cajaStorage.getIngresosPorDia(dateString),
        ingresosEfectivoDia: cajaStorage.getIngresosPorDiaYMetodo(dateString, 'efectivo'),
        ingresosTransferenciaDia: cajaStorage.getIngresosPorDiaYMetodo(dateString, 'transferencia'),
        retirosDia: cajaStorage.getRetirosPorDia(dateString)
      });
    } catch (error) {
      console.error('Error loading caja data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recargar datos cada 2 segundos para mantener sincronización
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRetiroClick = () => {
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2580') {
      setPasswordModalOpen(false);
      setPassword('');
      setTipoRetiro('retiro');
      setModalOpen(true);
    } else {
      alert('Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleRetiro = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const concepto = formData.get('concepto') as string;
    const monto = Number(formData.get('monto'));

    if (monto <= 0 || monto > totales.totalEfectivo) {
      alert('El monto debe ser mayor a 0 y no puede exceder el total de efectivo disponible.');
      return;
    }

    try {
      cajaStorage.registrarRetiro(concepto, monto);
      loadData(); // Recargar datos inmediatamente
      setModalOpen(false);
      setTipoRetiro(null);
    } catch (error) {
      console.error('Error al registrar retiro:', error);
      alert('Error al registrar el retiro. Intenta nuevamente.');
    }
  };

  const handleDateChange = (days: number) => {
    setSelectedDate(dateUtils.addDays(selectedDate, days));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMetodoPagoIcon = (metodo?: string) => {
    if (metodo === 'efectivo') return '💵';
    if (metodo === 'transferencia') return '🏦';
    if (metodo === 'pendiente') return '⏳';
    return '💰';
  };

  const getTransactionColor = (transaccion: TransaccionCaja) => {
    if (transaccion.tipo === 'ingreso') {
      if (transaccion.metodo_pago === 'efectivo') {
        return 'bg-green-50 border-l-4 border-green-400';
      } else if (transaccion.metodo_pago === 'transferencia') {
        return 'bg-blue-50 border-l-4 border-blue-400';
      }
      return 'bg-green-50 border-l-4 border-green-400';
    }
    return 'bg-red-50 border-l-4 border-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleRetiroClick}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <Minus className="w-4 h-4 mr-2" />
            Registrar Retiro
          </button>
        </div>
      </div>

      {/* Resumen de caja */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total en Caja</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(totales.totalCaja)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Efectivo</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(totales.totalEfectivo)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transferencias</p>
              <p className="text-2xl font-semibold text-blue-600">
                {formatCurrency(totales.totalTransferencia)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
              <p className="text-2xl font-semibold text-orange-600">
                {formatCurrency(totales.ingresosDia)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Efectivo Hoy</p>
              <p className="text-2xl font-semibold text-green-600">
                {formatCurrency(totales.ingresosEfectivoDia)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transferencias Hoy</p>
              <p className="text-2xl font-semibold text-blue-600">
                {formatCurrency(totales.ingresosTransferenciaDia)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Retiros Hoy</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(totales.retirosDia)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {dateUtils.formatDisplayDate(selectedDate)}
            </h2>
            {dateUtils.isToday(selectedDate) && (
              <span className="text-sm text-blue-600 font-medium">Hoy</span>
            )}
          </div>
          
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lista de transacciones del día */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Transacciones del día ({transacciones.length})
            </h3>
            {loading && (
              <div className="flex items-center text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </div>
            )}
          </div>
          
          {transacciones.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay transacciones para este día.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transacciones
                .sort((a, b) => b.fecha_hora.getTime() - a.fecha_hora.getTime())
                .map(transaccion => (
                <div 
                  key={transaccion.id} 
                  className={`flex items-center justify-between p-4 rounded-lg ${getTransactionColor(transaccion)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaccion.tipo === 'ingreso' ? 
                        (transaccion.metodo_pago === 'efectivo' ? 'bg-green-100' : 'bg-blue-100') : 
                        'bg-red-100'
                    }`}>
                      {transaccion.tipo === 'ingreso' ? 
                        <TrendingUp className={`w-5 h-5 ${
                          transaccion.metodo_pago === 'efectivo' ? 'text-green-600' : 'text-blue-600'
                        }`} /> :
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{transaccion.concepto}</h4>
                        {transaccion.metodo_pago && (
                          <span className="text-lg">
                            {getMetodoPagoIcon(transaccion.metodo_pago)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {transaccion.fecha_hora.toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {transaccion.metodo_pago && (
                          <span className="ml-2 capitalize">• {transaccion.metodo_pago}</span>
                        )}
                        {transaccion.reserva_id && (
                          <span className="ml-2 text-blue-600">• Reserva</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`text-lg font-semibold ${
                    transaccion.tipo === 'ingreso' ? 
                      (transaccion.metodo_pago === 'efectivo' ? 'text-green-600' : 'text-blue-600') : 
                      'text-red-600'
                  }`}>
                    {transaccion.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(transaccion.monto)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para contraseña */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setPasswordModalOpen(false)} />
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Contraseña de Administrador
                </h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingrese la contraseña para autorizar el retiro
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Contraseña"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPassword('');
                    }}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Autorizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para retiro */}
      {modalOpen && tipoRetiro === 'retiro' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setModalOpen(false)} />
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Registrar Retiro de Caja
              </h3>

              <form onSubmit={handleRetiro} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concepto del retiro
                  </label>
                  <input
                    type="text"
                    name="concepto"
                    placeholder="Ej: Gastos operativos, Pago a proveedor..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a retirar
                  </label>
                  <input
                    type="number"
                    name="monto"
                    min="1"
                    max={totales.totalEfectivo}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Efectivo disponible: {formatCurrency(totales.totalEfectivo)}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Registrar Retiro
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};