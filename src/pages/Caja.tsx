import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Minus,
  CreditCard, Banknote, Lock, ChevronLeft, ChevronRight, RefreshCw, Tag, 
  LogOut, History, X
} from 'lucide-react';
import { TransaccionCaja } from '../types';
import { cajaStorage } from '../storage/caja';
import { dateUtils } from '../utils/dates';
import { cierreUtils } from '../utils/cierreUtils';
import { cierresStorage } from '../storage/cierres';
import { CierreTurnoModal } from '../components/CierreTurno';
import { ConsultaCierres } from '../components/ConsultaCierres';

/** ---------------------------
 * Helpers de fecha/hora (LOCAL)
 * ---------------------------
 * 1) toInputDateTimeLocal: convierte Date -> string "YYYY-MM-DDTHH:mm" en **hora local**
 */
function toInputDateTimeLocal(d: Date): string {
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

export const Caja: React.FC = () => {
  const [transacciones, setTransacciones] = useState<TransaccionCaja[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoRetiro, setTipoRetiro] = useState<'retiro' | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [ingresoModalOpen, setIngresoModalOpen] = useState(false);
  const [cierreModalOpen, setCierreModalOpen] = useState(false);
  const [consultaCierresOpen, setConsultaCierresOpen] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [fechaInicioTurno, setFechaInicioTurno] = useState<Date>(new Date());
  const [cierreGenerado, setCierreGenerado] = useState<any>(null);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [totales, setTotales] = useState({
    totalCaja: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    ingresosDia: 0,
    ingresosEfectivoDia: 0,
    ingresosTransferenciaDia: 0,
    retirosDia: 0,
    señasDia: 0,
    saldosDia: 0,
    ingresosManualesDia: 0
  });
  const [loading, setLoading] = useState(false);

  const esSeña = (t: TransaccionCaja) =>
    t.tipo === 'ingreso' && (t.concepto?.toLowerCase() || '').startsWith('seña');

  const esSaldo = (t: TransaccionCaja) =>
    t.tipo === 'ingreso' && !esSeña(t) && !!t.reserva_id;

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      const dateString = dateUtils.formatDate(selectedDate);
      const transaccionesDia = cajaStorage.getByDate(dateString);

      const señasDia = transaccionesDia
        .filter(t => esSeña(t))
        .reduce((acc, t) => acc + t.monto, 0);

      const saldosDia = transaccionesDia
        .filter(t => esSaldo(t))
        .reduce((acc, t) => acc + t.monto, 0);

      const ingresosManualesDia = transaccionesDia
        .filter(t => t.tipo === 'ingreso' && !t.reserva_id && !esSeña(t))
        .reduce((acc, t) => acc + t.monto, 0);

      setTransacciones(transaccionesDia);
      setTotales({
        totalCaja: cajaStorage.getTotalCaja(),
        totalEfectivo: cajaStorage.getTotalEfectivo(),
        totalTransferencia: cajaStorage.getTotalTransferencia(),
        ingresosDia: cajaStorage.getIngresosPorDia(dateString),
        ingresosEfectivoDia: cajaStorage.getIngresosPorDiaYMetodo(dateString, 'efectivo'),
        ingresosTransferenciaDia: cajaStorage.getIngresosPorDiaYMetodo(dateString, 'transferencia'),
        retirosDia: cajaStorage.getRetirosPorDia(dateString),
        señasDia,
        saldosDia,
        ingresosManualesDia
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

  // Recarga periódica ligera
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
      loadData();
      setModalOpen(false);
      setTipoRetiro(null);
    } catch (error) {
      console.error('Error al registrar retiro:', error);
      alert('Error al registrar el retiro. Intenta nuevamente.');
    }
  };

  const handleIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const concepto = formData.get('concepto') as string;
    const monto = Number(formData.get('monto'));
    const metodoPago = formData.get('metodo_pago') as 'efectivo' | 'transferencia';

    if (monto <= 0) {
      alert('El monto debe ser mayor a 0.');
      return;
    }

    try {
      cajaStorage.registrarIngreso(concepto, monto, undefined, metodoPago);
      loadData();
      setIngresoModalOpen(false);
    } catch (error) {
      console.error('Error al registrar ingreso:', error);
      alert('Error al registrar el ingreso. Intenta nuevamente.');
    }
  };

  const handleDateChange = (days: number) => {
    setSelectedDate(dateUtils.addDays(selectedDate, days));
  };

  const handleCerrarTurno = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const usuarioTurno = formData.get('usuario') as string;
    
    if (!usuarioTurno.trim()) {
      alert('El nombre del usuario es obligatorio');
      return;
    }

    try {
      // ✅ Pasar directamente las Date locales (sin convertir a ISO/Z)
      const cierre = cierreUtils.generarCierre(
        usuarioTurno,
        fechaInicioTurno,
        new Date()
      );

      cierresStorage.save(cierre);
      setCierreGenerado(cierre);
      setShowCierreModal(true);
      setCierreModalOpen(false);
      setUsuario('');
      setFechaInicioTurno(new Date());
    } catch (error) {
      console.error('Error al guardar cierre:', error);
      alert('Error al generar el cierre de turno');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount);

  const getMetodoPagoIcon = (metodo?: string) => {
    if (metodo === 'efectivo') return '💵';
    if (metodo === 'transferencia') return '🏦';
    if (metodo === 'pendiente') return '⏳';
    return '💰';
  };

  const getTransactionColor = (t: TransaccionCaja) => {
    if (t.tipo === 'ingreso') {
      if (esSeña(t)) return 'bg-amber-50 border-l-4 border-amber-400';
      if (t.metodo_pago === 'efectivo') return 'bg-green-50 border-l-4 border-green-400';
      if (t.metodo_pago === 'transferencia') return 'bg-blue-50 border-l-4 border-blue-400';
      return 'bg-green-50 border-l-4 border-green-400';
    }
    return 'bg-red-50 border-l-4 border-red-400';
  };

  return (
    <div className="space-y-6">
      {/* ... (el resto de tu JSX se mantiene igual) ... */}
      {/* Para ahorrar espacio aquí, dejé intacto todo tu JSX de tarjetas, tablas y modales,
          ya que el único cambio funcional relevante es en handleCerrarTurno y el helper toInputDateTimeLocal. */}
      {/* Copiá/pegá el mismo JSX que ya tenías a partir de aquí. */}
    </div>
  );
};
