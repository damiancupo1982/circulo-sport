import React, { useState, useEffect } from 'react';
import { DollarSign, Minus, Lock, LogOut, RefreshCw, X, Eye } from 'lucide-react';
import { TransaccionCaja, CierreTurno } from '../types';
import { cajaStorage } from '../storage/caja';
import { reservasStorage } from '../storage/reservas';
import { cierresStorage } from '../storage/cierres';
import { CANCHAS } from '../types';

interface TransaccionDetallada extends TransaccionCaja {
  reserva_info?: {
    cancha_nombre: string;
    hora_inicio: string;
    hora_fin: string;
    cliente_nombre: string;
    fecha: string;
  };
}

export default function Caja() {
  const [transaccionesTurno, setTransaccionesTurno] = useState<TransaccionDetallada[]>([]);
  const [fechaInicioTurno, setFechaInicioTurno] = useState<Date>(new Date());
  const [turnoIniciado, setTurnoIniciado] = useState(false);
  const [retiroModalOpen, setRetiroModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [cierreModalOpen, setCierreModalOpen] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [cierreGenerado, setCierreGenerado] = useState<CierreTurno | null>(null);
  const [showCierreDetalle, setShowCierreDetalle] = useState(false);

  // Totales del turno
  const [totales, setTotales] = useState({
    totalEfectivo: 0,
    totalTransferencias: 0,
    totalGeneral: 0,
    cantidadTransacciones: 0
  });

  // Cargar transacciones del turno actual
  const cargarTransaccionesTurno = () => {
    if (!turnoIniciado) return;

    const ahora = new Date();
    const todasTransacciones = cajaStorage.getAll();
    
    // Filtrar transacciones desde el inicio del turno
    const transaccionesFiltradas = todasTransacciones.filter(t => {
      const fechaTransaccion = new Date(t.fecha_hora);
      return fechaTransaccion >= fechaInicioTurno && fechaTransaccion <= ahora;
    });

    // Enriquecer con información de reservas
    const transaccionesDetalladas: TransaccionDetallada[] = transaccionesFiltradas.map(t => {
      if (t.reserva_id) {
        const reserva = reservasStorage.getById(t.reserva_id);
        if (reserva) {
          const cancha = CANCHAS.find(c => c.id === reserva.cancha_id);
          return {
            ...t,
            reserva_info: {
              cancha_nombre: cancha?.nombre || reserva.cancha_id,
              hora_inicio: reserva.hora_inicio,
              hora_fin: reserva.hora_fin,
              cliente_nombre: reserva.cliente_nombre,
              fecha: reserva.fecha
            }
          };
        }
      }
      return t;
    });

    setTransaccionesTurno(transaccionesDetalladas);

    // Calcular totales
    let efectivo = 0;
    let transferencias = 0;
    let total = 0;

    transaccionesDetalladas.forEach(t => {
      if (t.tipo === 'ingreso') {
        total += t.monto;
        if (t.metodo_pago === 'efectivo') {
          efectivo += t.monto;
        } else if (t.metodo_pago === 'transferencia') {
          transferencias += t.monto;
        }
      } else if (t.tipo === 'retiro') {
        total -= t.monto;
        efectivo -= t.monto; // Los retiros siempre son de efectivo
      }
    });

    setTotales({
      totalEfectivo: efectivo,
      totalTransferencias: transferencias,
      totalGeneral: total,
      cantidadTransacciones: transaccionesDetalladas.length
    });
  };

  useEffect(() => {
    if (turnoIniciado) {
      cargarTransaccionesTurno();
      const interval = setInterval(cargarTransaccionesTurno, 3000);
      return () => clearInterval(interval);
    }
  }, [turnoIniciado, fechaInicioTurno]);

  const iniciarTurno = () => {
    setFechaInicioTurno(new Date());
    setTurnoIniciado(true);
  };

  const handleRetiroClick = () => {
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '2580') {
      setPasswordModalOpen(false);
      setPassword('');
      setRetiroModalOpen(true);
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

    if (monto <= 0) {
      alert('El monto debe ser mayor a 0.');
      return;
    }

    if (monto > totales.totalEfectivo) {
      alert('No hay suficiente efectivo disponible para este retiro.');
      return;
    }

    try {
      cajaStorage.registrarRetiro(concepto, monto);
      cargarTransaccionesTurno();
      setRetiroModalOpen(false);
    } catch (error) {
      console.error('Error al registrar retiro:', error);
      alert('Error al registrar el retiro. Intenta nuevamente.');
    }
  };

  const generarCierreTurno = () => {
    if (!usuario.trim()) {
      alert('El nombre del usuario es obligatorio');
      return;
    }

    const ahora = new Date();
    const duracionMinutos = Math.floor((ahora.getTime() - fechaInicioTurno.getTime()) / (1000 * 60));

    // Crear detalle de transacciones para el cierre
    const detalleTransacciones = transaccionesTurno
      .filter(t => t.tipo === 'ingreso') // Solo ingresos para el detalle de ventas
      .map(t => ({
        fecha: new Date(t.fecha_hora).toLocaleDateString('es-AR'),
        hora: new Date(t.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        cliente_nombre: t.reserva_info?.cliente_nombre || t.concepto || 'Ingreso manual',
        cancha: t.reserva_info?.cancha_nombre || 'N/A',
        horario_desde: t.reserva_info?.hora_inicio || '',
        horario_hasta: t.reserva_info?.hora_fin || '',
        importe: t.monto,
        metodo_pago: t.metodo_pago || 'N/A'
      }));

    const cierre: CierreTurno = {
      id: `cierre-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      usuario,
      fecha_inicio: fechaInicioTurno,
      fecha_fin: ahora,
      duracion_minutos: duracionMinutos,
      totales: {
        efectivo: totales.totalEfectivo,
        transferencias: totales.totalTransferencias,
        expensas: 0,
        total_general: totales.totalGeneral
      },
      cantidad_ventas: detalleTransacciones.length,
      transacciones: detalleTransacciones,
      reservas_detalle: [], // No necesario para este caso
      created_at: new Date()
    };

    // Guardar el cierre
    cierresStorage.save(cierre);
    setCierreGenerado(cierre);
    setShowCierreDetalle(true);
    setCierreModalOpen(false);
    setUsuario('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!turnoIniciado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <DollarSign className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema de Caja</h1>
            <p className="text-gray-600">Inicia un nuevo turno para comenzar</p>
          </div>
          
          <button
            onClick={iniciarTurno}
            className="w-full flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Iniciar Turno
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja - Turno Activo</h1>
          <p className="text-gray-600">Iniciado: {formatDateTime(fechaInicioTurno)}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={cargarTransaccionesTurno}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          <button
            onClick={handleRetiroClick}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            <Minus className="w-4 h-4 mr-2" />
            Retiro de Efectivo
          </button>
          <button
            onClick={() => setCierreModalOpen(true)}
            className="flex items-center px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Turno
          </button>
        </div>
      </div>

      {/* Totales del turno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Efectivo</p>
              <p className="text-2xl font-semibold text-green-600">{formatCurrency(totales.totalEfectivo)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transferencias</p>
              <p className="text-2xl font-semibold text-blue-600">{formatCurrency(totales.totalTransferencias)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total General</p>
              <p className="text-2xl font-semibold text-purple-600">{formatCurrency(totales.totalGeneral)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de transacciones del turno */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Transacciones del Turno ({totales.cantidadTransacciones})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transaccionesTurno.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No hay transacciones en este turno
                  </td>
                </tr>
              ) : (
                transaccionesTurno
                  .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
                  .map(t => (
                    <tr key={t.id} className={t.tipo === 'retiro' ? 'bg-red-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(t.fecha_hora).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(t.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t.reserva_info?.cliente_nombre || t.concepto || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t.reserva_info?.cancha_nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t.reserva_info ? `${t.reserva_info.hora_inicio} - ${t.reserva_info.hora_fin}` : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(t.monto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {t.metodo_pago || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          t.tipo === 'ingreso' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {t.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de contraseña para retiro */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setPasswordModalOpen(false)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Autorización Requerida</h3>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingrese la contraseña de administrador
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
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPassword('');
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de retiro */}
      {retiroModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setRetiroModalOpen(false)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Retiro de Efectivo</h3>
              
              <form onSubmit={handleRetiro}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Concepto</label>
                  <input
                    type="text"
                    name="concepto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Motivo del retiro"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <input
                    type="number"
                    name="monto"
                    min="1"
                    max={totales.totalEfectivo}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Efectivo disponible: {formatCurrency(totales.totalEfectivo)}
                  </p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRetiroModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Registrar Retiro
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cierre de turno */}
      {cierreModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setCierreModalOpen(false)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cerrar Turno</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del usuario del turno
                </label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Resumen del turno:</strong><br />
                  • Duración: {Math.floor((new Date().getTime() - fechaInicioTurno.getTime()) / (1000 * 60))} minutos<br />
                  • Transacciones: {totales.cantidadTransacciones}<br />
                  • Total: {formatCurrency(totales.totalGeneral)}
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCierreModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={generarCierreTurno}
                  className="px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  Generar Cierre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle del cierre */}
      {showCierreDetalle && cierreGenerado && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowCierreDetalle(false)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Cierre de Turno Generado</h3>
                <button
                  onClick={() => setShowCierreDetalle(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Turno</h4>
                  <p><span className="text-gray-600">Usuario:</span> <strong>{cierreGenerado.usuario}</strong></p>
                  <p><span className="text-gray-600">Inicio:</span> {formatDateTime(cierreGenerado.fecha_inicio)}</p>
                  <p><span className="text-gray-600">Fin:</span> {formatDateTime(cierreGenerado.fecha_fin)}</p>
                  <p><span className="text-gray-600">Duración:</span> {Math.floor(cierreGenerado.duracion_minutos / 60)}h {cierreGenerado.duracion_minutos % 60}m</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Totales</h4>
                  <p><span className="text-gray-600">Efectivo:</span> <strong className="text-green-600">{formatCurrency(cierreGenerado.totales.efectivo)}</strong></p>
                  <p><span className="text-gray-600">Transferencias:</span> <strong className="text-blue-600">{formatCurrency(cierreGenerado.totales.transferencias)}</strong></p>
                  <p><span className="text-gray-600">Total General:</span> <strong>{formatCurrency(cierreGenerado.totales.total_general)}</strong></p>
                  <p><span className="text-gray-600">Cantidad de ventas:</span> <strong>{cierreGenerado.cantidad_ventas}</strong></p>
                </div>
              </div>

              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium text-gray-900">Detalle de Transacciones</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                        <th className="text-left p-3 font-medium text-gray-600">Hora</th>
                        <th className="text-left p-3 font-medium text-gray-600">Cliente</th>
                        <th className="text-left p-3 font-medium text-gray-600">Cancha</th>
                        <th className="text-left p-3 font-medium text-gray-600">Horario</th>
                        <th className="text-left p-3 font-medium text-gray-600">Importe</th>
                        <th className="text-left p-3 font-medium text-gray-600">Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cierreGenerado.transacciones.map((t, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-3">{t.fecha}</td>
                          <td className="p-3">{t.hora}</td>
                          <td className="p-3">{t.cliente_nombre}</td>
                          <td className="p-3">{t.cancha}</td>
                          <td className="p-3">{t.horario_desde && t.horario_hasta ? `${t.horario_desde} - ${t.horario_hasta}` : 'N/A'}</td>
                          <td className="p-3 font-medium text-green-600">{formatCurrency(t.importe)}</td>
                          <td className="p-3 capitalize">{t.metodo_pago}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCierreDetalle(false);
                    setTurnoIniciado(false);
                    setTransaccionesTurno([]);
                    setCierreGenerado(null);
                  }}
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Finalizar y Nuevo Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}