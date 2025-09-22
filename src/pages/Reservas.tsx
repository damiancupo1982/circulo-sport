import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Lock } from 'lucide-react';
import { Reserva, CANCHAS, HORARIOS_DISPONIBLES } from '../types';
import { reservasStorage } from '../storage/reservas';
import { cajaStorage } from '../storage/caja';
import { dateUtils } from '../utils/dates';
import { ReservaModal } from '../components/ReservaModal';

export const Reservas: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | undefined>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState<Reserva | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [modalDefaults, setModalDefaults] = useState<{ cancha?: string; fecha?: string; horaInicio?: string; horaFin?: string; }>({});

  useEffect(() => {
    loadReservas();
  }, [selectedDate]);

  const loadReservas = () => {
    const dateString = dateUtils.formatDate(selectedDate);
    setReservas(reservasStorage.getByDate(dateString));
  };

  // Registra solo el DELTA de seña si:
  // - la reserva está en "pendiente"
  // - y la seña "aplica a caja" (primera de la serie o reserva única)
  const registerDepositDeltaIfAny = (newReserva: Reserva, prevReserva?: Reserva) => {
    if (newReserva.metodo_pago !== 'pendiente') return;
    if (newReserva.seña_aplica_caja === false) return;

    const prevDeposit = Math.max(0, prevReserva?.seña_monto || 0);
    const newDeposit = Math.max(0, newReserva.seña_monto || 0);
    const delta = newDeposit - prevDeposit;

    if (delta > 0) {
      const concepto = `Seña Reserva ${CANCHAS.find(c => c.id === newReserva.cancha_id)?.nombre} - ${newReserva.cliente_nombre}`;
      cajaStorage.registrarIngreso(concepto, delta, newReserva.id, newReserva.seña_metodo || 'efectivo');
    }
  };

  // Al confirmar pago (pasar de pendiente a efectivo/transferencia),
  // registrar en caja el SALDO (total - seña acumulada)
  const registerBalanceIfConfirming = (newReserva: Reserva, prevReserva?: Reserva) => {
    const wasPending = prevReserva?.metodo_pago === 'pendiente';
    const nowConfirmed = newReserva.metodo_pago !== 'pendiente';
    if (!wasPending || !nowConfirmed) return;

    const deposit = Math.max(0, newReserva.seña_monto || 0);
    const balance = Math.max(0, (newReserva.total || 0) - deposit);
    if (balance > 0) {
      const concepto = `Reserva ${CANCHAS.find(c => c.id === newReserva.cancha_id)?.nombre} - ${newReserva.cliente_nombre}`;
      cajaStorage.registrarIngreso(concepto, balance, newReserva.id, newReserva.metodo_pago);
    }
  };

  const handleSaveReserva = (reserva: Reserva) => {
    if (!reservasStorage.isSlotAvailable(
      reserva.cancha_id,
      reserva.fecha,
      reserva.hora_inicio,
      reserva.hora_fin,
      reserva.id
    )) {
      alert('❌ El horario seleccionado ya está ocupado. Por favor, elegí otro horario.');
      return;
    }

    // 1) Si está pendiente, registrar delta de seña (solo si aplica a caja)
    registerDepositDeltaIfAny(reserva, selectedReserva);

    // 2) Si se confirma ahora, registrar saldo
    registerBalanceIfConfirming(reserva, selectedReserva);

    // Guardar
    reservasStorage.save(reserva);

    loadReservas();
    setSelectedReserva(undefined);
  };

  const handleDeleteReserva = (reserva: Reserva) => {
    setReservaToDelete(reserva);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (deletePassword === '2580' && reservaToDelete) {
      reservasStorage.delete(reservaToDelete.id);
      loadReservas();
      setDeleteModalOpen(false);
      setReservaToDelete(null);
      setDeletePassword('');
    } else {
      alert('Contraseña incorrecta');
      setDeletePassword('');
    }
  };

  const handleSlotClick = (canchaid: string, hora: string) => {
    const horaFin = getHoraFin(hora);
    if (!reservasStorage.isSlotAvailable(canchaid, dateUtils.formatDate(selectedDate), hora, horaFin)) {
      const reservaExistente = reservas.find(r =>
        r.cancha_id === canchaid &&
        r.hora_inicio <= hora &&
        r.hora_fin > hora
      );
      if (reservaExistente) {
        setSelectedReserva(reservaExistente);
        setModalDefaults({});
        setModalOpen(true);
      }
      return;
    }

    setSelectedReserva(undefined);
    setModalDefaults({ cancha: canchaid, fecha: dateUtils.formatDate(selectedDate), horaInicio: hora, horaFin });
    setModalOpen(true);
  };

  const getHoraFin = (horaInicio: string): string => {
    const [hours, minutes] = horaInicio.split(':').map(Number);
    let newMinutes = minutes + 30;
    let newHours = hours;
    if (newMinutes >= 60) { newMinutes -= 60; newHours += 1; }
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const getReservaForSlot = (canchaid: string, hora: string): Reserva | undefined => {
    return reservas.find(r =>
      r.cancha_id === canchaid &&
      r.hora_inicio <= hora &&
      r.hora_fin > hora
    );
  };

  const getSlotClass = (canchaid: string, hora: string): string => {
    const reserva = getReservaForSlot(canchaid, hora);
    if (!reserva) return 'bg-gray-50 hover:bg-gray-100 cursor-pointer border border-gray-200';

    const cancha = CANCHAS.find(c => c.id === canchaid);
    let colorClass = cancha?.color || 'bg-blue-500';

    if (reserva.estado === 'cancelada') colorClass = 'bg-red-200';
    else if (reserva.metodo_pago === 'pendiente') colorClass = 'bg-yellow-200';
    else if (reserva.estado === 'confirmada' && reserva.metodo_pago !== 'pendiente') colorClass = 'bg-green-200';
    else colorClass = colorClass.replace('500', '200');

    return `${colorClass} cursor-pointer border border-gray-300`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <button
          onClick={() => { setSelectedReserva(undefined); setModalDefaults({}); setModalOpen(true); }}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
        </button>
      </div>

      {/* Selector de fecha */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
        <button onClick={() => setSelectedDate(dateUtils.addDays(selectedDate, -1))} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">{dateUtils.formatDisplayDate(selectedDate)}</h2>
          {dateUtils.isToday(selectedDate) && (<span className="text-sm text-blue-600 font-medium">Hoy</span>)}
        </div>

        <button onClick={() => setSelectedDate(dateUtils.addDays(selectedDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grilla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid bg-gray-50 border-b" style={{ gridTemplateColumns: `200px repeat(${HORARIOS_DISPONIBLES.length}, 60px)` }}>
              <div className="p-3 font-medium text-gray-900 border-r">Cancha</div>
              {HORARIOS_DISPONIBLES.map(hora => (
                <div key={hora} className="p-2 text-xs font-medium text-gray-700 text-center border-r whitespace-nowrap">{hora}</div>
              ))}
            </div>

            {CANCHAS.map(cancha => (
              <div key={cancha.id} className="grid border-b" style={{ gridTemplateColumns: `200px repeat(${HORARIOS_DISPONIBLES.length}, 60px)` }}>
                <div className="p-3 font-medium text-gray-900 border-r bg-gray-50">
                  <div className={`w-3 h-3 rounded-full ${cancha.color} inline-block mr-2`} />
                  {cancha.nombre}
                </div>
                {HORARIOS_DISPONIBLES.map(hora => {
                  const reserva = getReservaForSlot(cancha.id, hora);
                  return (
                    <div
                      key={hora}
                      onClick={() => handleSlotClick(cancha.id, hora)}
                      className={`p-1 min-h-[60px] ${getSlotClass(cancha.id, hora)} border-r relative transition-colors`}
                    >
                      {reserva && (
                        <div className="absolute inset-0 p-1 flex flex-col justify-center">
                          <div className="text-xs font-medium text-gray-800 truncate">{reserva.cliente_nombre}</div>
                          <div className="text-xs text-gray-600">${reserva.total.toLocaleString()}</div>
                          {reserva.metodo_pago === 'pendiente' && (
                            <div className="flex items-center gap-1 text-xs text-orange-700 font-medium">
                              PEND
                              {Math.max(0, reserva.seña_monto || 0) > 0 && (
                                <span className="ml-1">• Seña ${Number(reserva.seña_monto).toLocaleString()}</span>
                              )}
                              {reserva.seña_aplica_caja === false && <span className="ml-1">(inf.)</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista del día */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservas del día ({reservas.length})</h3>

          {reservas.length === 0 ? (
            <p className="text-gray-500">No hay reservas para este día.</p>
          ) : (
            <div className="space-y-3">
              {reservas.map(reserva => {
                const cancha = CANCHAS.find(c => c.id === reserva.cancha_id);
                let bgColor = 'bg-gray-50';
                if (reserva.metodo_pago === 'pendiente') bgColor = 'bg-yellow-50 border-l-4 border-yellow-400';
                else if (reserva.estado === 'confirmada') bgColor = 'bg-green-50 border-l-4 border-green-400';

                const deposit = Math.max(0, reserva.seña_monto || 0);
                const saldo = Math.max(0, (reserva.total || 0) - deposit);

                return (
                  <div key={reserva.id} className={`flex items-center justify-between p-4 rounded-lg ${bgColor}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${cancha?.color}`} />
                      <div>
                        <div className="font-medium text-gray-900">{reserva.cliente_nombre} - {cancha?.nombre}</div>
                        <div className="text-sm text-gray-600">
                          {reserva.hora_inicio} - {reserva.hora_fin} • ${reserva.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reserva.metodo_pago === 'pendiente'
                            ? `PENDIENTE • Seña $${deposit.toLocaleString()}${reserva.seña_aplica_caja === false ? ' (informativa)' : ''} • Saldo $${saldo.toLocaleString()}`
                            : `CONFIRMADA • ${reserva.metodo_pago.toUpperCase()}`}
                          {reserva.seña && <span className="ml-2 text-blue-600">• {reserva.seña}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setSelectedReserva(reserva); setModalDefaults({}); setModalOpen(true); }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReserva(reserva)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <ReservaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveReserva}
        reserva={selectedReserva}
        defaultCancha={modalDefaults.cancha}
        defaultFecha={modalDefaults.fecha}
        defaultHoraInicio={modalDefaults.horaInicio}
        defaultHoraFin={modalDefaults.horaFin}
      />

      {/* Confirmar eliminación */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setDeleteModalOpen(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Eliminar Reserva</h3>
              </div>

              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que querés eliminar la reserva de <strong>{reservaToDelete?.cliente_nombre}</strong>?
              </p>

              <form onSubmit={handleConfirmDelete} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña de administrador</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Contraseña"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => { setDeleteModalOpen(false); setReservaToDelete(null); setDeletePassword(''); }}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">
                    Eliminar Reserva
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
