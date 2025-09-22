import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Reserva, Cliente, Extra, ItemLibre, CANCHAS, ExtraDisponible } from '../types';
import { clientesStorage } from '../storage/clientes';
import { extrasStorage } from '../storage/extras';
import { reservasStorage } from '../storage/reservas';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reserva: Reserva) => void;
  reserva?: Reserva;
  defaultCancha?: string;
  defaultFecha?: string;
  defaultHoraInicio?: string;
  defaultHoraFin?: string;
}

export const ReservaModal: React.FC<ReservaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  reserva,
  defaultCancha,
  defaultFecha,
  defaultHoraInicio,
  defaultHoraFin
}) => {
  const [formData, setFormData] = useState({
    cancha_id: '',
    cliente_id: '',
    cliente_nombre: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    metodo_pago: 'pendiente' as 'efectivo' | 'transferencia' | 'pendiente',
    precio_base: 0,
    extras: [] as Extra[],
    items_libres: [] as ItemLibre[],
    estado: 'confirmada' as 'confirmada' | 'pendiente' | 'cancelada',
    seña: ''
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [extrasDisponibles, setExtrasDisponibles] = useState<ExtraDisponible[]>([]);
  const [clienteQuery, setClienteQuery] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '' });
  const [showNuevoClienteForm, setShowNuevoClienteForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingReserva, setPendingReserva] = useState<Reserva | null>(null);
  const [tipoReserva, setTipoReserva] = useState<'unica' | 'semanal'>('unica');
  const [reservasSemanales, setReservasSemanales] = useState<Reserva[]>([]);
  const [showWeeklyPreview, setShowWeeklyPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (reserva) {
        setFormData({
          cancha_id: reserva.cancha_id,
          cliente_id: reserva.cliente_id,
          cliente_nombre: reserva.cliente_nombre,
          fecha: reserva.fecha,
          hora_inicio: reserva.hora_inicio,
          hora_fin: reserva.hora_fin,
          metodo_pago: reserva.metodo_pago,
          precio_base: reserva.precio_base,
          extras: [...reserva.extras],
          items_libres: [...reserva.items_libres],
          estado: reserva.estado,
          seña: reserva.seña || ''
        });
        setClienteQuery(reserva.cliente_nombre);
      } else {
        const cancha = CANCHAS.find(c => c.id === defaultCancha) || CANCHAS[0];
        setFormData({
          cancha_id: defaultCancha || cancha.id,
          cliente_id: '',
          cliente_nombre: '',
          fecha: defaultFecha || '',
          hora_inicio: defaultHoraInicio || '',
          hora_fin: defaultHoraFin || '',
          metodo_pago: 'pendiente',
          precio_base: cancha.precio_base,
          extras: [],
          items_libres: [],
          estado: 'confirmada',
          seña: ''
        });
        setClienteQuery('');
      }
      setClientes(clientesStorage.getAll());
      setExtrasDisponibles(extrasStorage.getAll());
    }
    setReservasSemanales([]);
    setShowWeeklyPreview(false);
  }, [isOpen, reserva, defaultCancha, defaultFecha, defaultHoraInicio, defaultHoraFin]);

  // Función para generar reservas semanales
  const generateWeeklyReservations = (baseReserva: Reserva): Reserva[] => {
    const reservas: Reserva[] = [];
    const baseDate = new Date(baseReserva.fecha + 'T00:00:00');
    const currentMonth = baseDate.getMonth();
    const currentYear = baseDate.getFullYear();
    
    // Generar reservas para el resto del mes
    let nextWeek = new Date(baseDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    while (nextWeek.getMonth() === currentMonth && nextWeek.getFullYear() === currentYear) {
      const fechaString = nextWeek.toISOString().split('T')[0];
      
      const nuevaReserva: Reserva = {
        ...baseReserva,
        id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${reservas.length}`,
        fecha: fechaString,
        created_at: new Date()
      };
      
      reservas.push(nuevaReserva);
      nextWeek.setDate(nextWeek.getDate() + 7);
    }
    
    return reservas;
  };

  // Función para verificar disponibilidad de reservas semanales
  const checkWeeklyAvailability = (reservas: Reserva[]): { available: Reserva[], conflicts: Reserva[] } => {
    const available: Reserva[] = [];
    const conflicts: Reserva[] = [];
    
    reservas.forEach(reserva => {
      const isAvailable = reservasStorage.isSlotAvailable(
        reserva.cancha_id,
        reserva.fecha,
        reserva.hora_inicio,
        reserva.hora_fin
      );
      
      if (isAvailable) {
        available.push(reserva);
      } else {
        conflicts.push(reserva);
      }
    });
    
    return { available, conflicts };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = formData.precio_base + 
      formData.extras.reduce((sum, e) => sum + (e.precio * e.cantidad), 0) +
      formData.items_libres.reduce((sum, i) => sum + i.precio, 0);

    const reservaData: Reserva = {
      id: reserva?.id || `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cancha_id: formData.cancha_id,
      cliente_id: formData.cliente_id,
      cliente_nombre: formData.cliente_nombre,
      fecha: formData.fecha,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin,
      metodo_pago: formData.metodo_pago,
      precio_base: formData.precio_base,
      extras: formData.extras,
      items_libres: formData.items_libres,
      total,
      estado: formData.estado,
      seña: formData.seña.trim() || undefined,
      created_at: reserva?.created_at || new Date()
    };

    // Si es reserva semanal y no estamos editando una reserva existente
    if (tipoReserva === 'semanal' && !reserva) {
      const semanales = generateWeeklyReservations(reservaData);
      const { available, conflicts } = checkWeeklyAvailability(semanales);
      
      setReservasSemanales([reservaData, ...available]);
      
      if (conflicts.length > 0) {
        alert(`⚠️ Hay ${conflicts.length} fechas con conflictos que no se podrán reservar:\n${conflicts.map(r => r.fecha).join(', ')}`);
      }
      
      setShowWeeklyPreview(true);
      setTipoReserva('unica'); // Las reservas existentes siempre son únicas
    } else {
      // Lógica original para reserva única
      if (reserva && reserva.metodo_pago === 'pendiente' && 
          (formData.metodo_pago === 'efectivo' || formData.metodo_pago === 'transferencia')) {
        setPendingReserva(reservaData);
        setShowConfirmModal(true);
      } else {
        onSave(reservaData);
        onClose();
      }
    }
  };

  const handleConfirmWeeklyReservations = () => {
    // Guardar todas las reservas semanales
    reservasSemanales.forEach(reserva => {
      onSave(reserva);
    });
    
    setShowWeeklyPreview(false);
    setReservasSemanales([]);
    onClose();
  };

  const handleConfirmPayment = () => {
    if (pendingReserva) {
      onSave(pendingReserva);
      setShowConfirmModal(false);
      setPendingReserva(null);
      onClose();
    }
  };

  const handleClienteSelect = (cliente: Cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre
    }));
    setClienteQuery(cliente.nombre);
    setShowClienteDropdown(false);
  };

  const handleCrearCliente = () => {
    if (!nuevoCliente.nombre.trim()) return;
    
    const cliente: Cliente = {
      id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      numero_socio: '', // Se generará automáticamente en el storage
      nombre: nuevoCliente.nombre.trim(),
      telefono: nuevoCliente.telefono.trim(),
      created_at: new Date()
    };

      setTipoReserva('unica');
    clientesStorage.save(cliente);
    setClientes(clientesStorage.getAll());
    handleClienteSelect(cliente);
    setNuevoCliente({ nombre: '', telefono: '' });
    setShowNuevoClienteForm(false);
  };

  const agregarExtra = (extra: ExtraDisponible) => {
    const nuevoExtra: Extra = {
      id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: extra.nombre,
      precio: extra.precio,
      cantidad: 1
    };
    setFormData(prev => ({
      ...prev,
      extras: [...prev.extras, nuevoExtra]
    }));
  };

  const actualizarExtra = (id: string, cantidad: number) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.map(e => e.id === id ? { ...e, cantidad } : e)
    }));
  };

  const eliminarExtra = (id: string) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.filter(e => e.id !== id)
    }));
  };

  const agregarItemLibre = () => {
    const nuevoItem: ItemLibre = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      descripcion: '',
      precio: 0
    };
    setFormData(prev => ({
      ...prev,
      items_libres: [...prev.items_libres, nuevoItem]
    }));
  };

  const actualizarItemLibre = (id: string, field: 'descripcion' | 'precio', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items_libres: prev.items_libres.map(i => 
        i.id === id ? { ...i, [field]: value } : i
      )
    }));
  };

  const eliminarItemLibre = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items_libres: prev.items_libres.filter(i => i.id !== id)
    }));
  };

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(clienteQuery.toLowerCase())
  );

  const total = formData.precio_base + 
    formData.extras.reduce((sum, e) => sum + (e.precio * e.cantidad), 0) +
    formData.items_libres.reduce((sum, i) => sum + i.precio, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {reserva ? 'Editar Reserva' : 'Nueva Reserva'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cancha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancha
                </label>
                <select
                  value={formData.cancha_id}
                  onChange={(e) => {
                    const cancha = CANCHAS.find(c => c.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      cancha_id: e.target.value,
                      precio_base: cancha?.precio_base || 0
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {CANCHAS.map(cancha => (
                    <option key={cancha.id} value={cancha.id}>
                      {cancha.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clienteQuery}
                    onChange={(e) => {
                      setClienteQuery(e.target.value);
                      setShowClienteDropdown(true);
                      setFormData(prev => ({
                        ...prev,
                        cliente_id: '',
                        cliente_nombre: e.target.value
                      }));
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar cliente..."
                    required
                  />
                  
                  {showClienteDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredClientes.map(cliente => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => handleClienteSelect(cliente)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                        >
                          <div className="font-medium">{cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{cliente.numero_socio} • {cliente.telefono}</div>
                        </button>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => setShowNuevoClienteForm(true)}
                        className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 border-t"
                      >
                        + Crear nuevo cliente
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago
                </label>
                <select
                  value={formData.metodo_pago}
                  onChange={(e) => {
                    const newMetodo = e.target.value as 'efectivo' | 'transferencia' | 'pendiente';
                    // No permitir volver a pendiente si ya está confirmada
                    if (reserva && reserva.metodo_pago !== 'pendiente' && newMetodo === 'pendiente') {
                      alert('No se puede cambiar una reserva confirmada a pendiente');
                      return;
                    }
                    setFormData(prev => ({ ...prev, metodo_pago: newMetodo }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {/* Precio base */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio base
                </label>
                <input
                  type="number"
                  value={formData.precio_base}
                  onChange={(e) => setFormData(prev => ({ ...prev, precio_base: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Tipo de reserva - Solo para nuevas reservas */}
            {!reserva && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de reserva
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="unica"
                      checked={tipoReserva === 'unica'}
                      onChange={(e) => setTipoReserva(e.target.value as 'unica' | 'semanal')}
                      className="mr-2"
                    />
                    Única
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="semanal"
                      checked={tipoReserva === 'semanal'}
                      onChange={(e) => setTipoReserva(e.target.value as 'unica' | 'semanal')}
                      className="mr-2"
                    />
                    Semanal (resto del mes)
                  </label>
                </div>
                {tipoReserva === 'semanal' && (
                  <p className="text-sm text-blue-600 mt-1">
                    Se crearán reservas automáticamente cada semana hasta el final del mes
                  </p>
                )}
              </div>
            )}

            {/* Seña */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seña / Comentarios
              </label>
              <textarea
                value={formData.seña}
                onChange={(e) => setFormData(prev => ({ ...prev, seña: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Ej: Seña $2000, Cliente habitual, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Este campo es solo informativo y no afecta los cálculos de caja
              </p>
            </div>

            {/* Extras */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-900">Extras</h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {extrasDisponibles.map(extra => (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => agregarExtra(extra)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {extra.nombre} (${extra.precio})
                  </button>
                ))}
              </div>

              {formData.extras.length > 0 && (
                <div className="space-y-2">
                  {formData.extras.map(extra => (
                    <div key={extra.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="flex-1">{extra.nombre}</span>
                      <input
                        type="number"
                        value={extra.cantidad}
                        onChange={(e) => actualizarExtra(extra.id, Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        min="1"
                      />
                      <span className="text-gray-600">${extra.precio * extra.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => eliminarExtra(extra.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items libres */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-900">Items libres</h4>
                <button
                  type="button"
                  onClick={agregarItemLibre}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </button>
              </div>

              {formData.items_libres.length > 0 && (
                <div className="space-y-2">
                  {formData.items_libres.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => actualizarItemLibre(item.id, 'descripcion', e.target.value)}
                        placeholder="Descripción"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        value={item.precio}
                        onChange={(e) => actualizarItemLibre(item.id, 'precio', Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        min="0"
                        placeholder="Precio"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarItemLibre(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className={`p-4 rounded-lg ${
              formData.metodo_pago === 'pendiente' ? 'bg-yellow-50 border border-yellow-200' : 
              formData.estado === 'confirmada' && formData.metodo_pago !== 'pendiente' ? 'bg-green-50 border border-green-200' :
              'bg-blue-50'
            }`}>
              <div className="text-lg font-semibold text-blue-900">
                Total: ${total.toLocaleString()}
              </div>
              {formData.metodo_pago === 'pendiente' && (
                <div className="text-sm text-yellow-700 mt-1">
                  ⚠️ Esta reserva no se registrará en caja hasta que se confirme el pago
                </div>
              )}
              {formData.estado === 'confirmada' && formData.metodo_pago !== 'pendiente' && (
                <div className="text-sm text-green-700 mt-1">
                  ✅ Reserva confirmada y registrada en caja
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
               {reserva ? 'Actualizar' : tipoReserva === 'semanal' ? 'Previsualizar Reservas' : 'Crear'} Reserva
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal para nuevo cliente */}
      {showNuevoClienteForm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowNuevoClienteForm(false)} />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Nuevo Cliente</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Teléfono"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowNuevoClienteForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCrearCliente}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    disabled={!nuevoCliente.nombre.trim()}
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de previsualización de reservas semanales */}
      {showWeeklyPreview && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Previsualización de Reservas Semanales</h3>
              
              <div className="mb-4">
                <p className="text-gray-600">
                  Se crearán <strong>{reservasSemanales.length}</strong> reservas:
                </p>
              </div>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {reservasSemanales.map((reserva, index) => {
                  const cancha = CANCHAS.find(c => c.id === reserva.cancha_id);
                  const fecha = new Date(reserva.fecha + 'T00:00:00');
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {fecha.toLocaleDateString('es-AR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {cancha?.nombre} • {reserva.hora_inicio} - {reserva.hora_fin}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${reserva.total.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{reserva.metodo_pago}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-blue-600 mr-3">ℹ️</div>
                  <div>
                    <div className="font-medium text-blue-900">
                      Total: ${(reservasSemanales.reduce((sum, r) => sum + r.total, 0)).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">
                      {reservasSemanales.filter(r => r.metodo_pago === 'pendiente').length > 0 && 
                        'Las reservas pendientes no se registrarán en caja hasta confirmar el pago'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowWeeklyPreview(false);
                    setReservasSemanales([]);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmWeeklyReservations}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Confirmar {reservasSemanales.length} Reservas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de pago */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Confirmar Pago</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Confirmas que se ha recibido el pago de <strong>${pendingReserva?.total.toLocaleString()}</strong> por 
                <strong> {pendingReserva?.metodo_pago}</strong>?
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Una vez confirmada, esta reserva no podrá volver a estado pendiente 
                  y se registrará automáticamente en la caja.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingReserva(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};