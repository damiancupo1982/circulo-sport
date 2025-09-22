import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Minus,
  CreditCard, Banknote, Lock, ChevronLeft, ChevronRight, RefreshCw, Tag
} from 'lucide-react';
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
  const [ingresoModalOpen, setIngresoModalOpen] = useState(false);
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
    t.tipo === 'ingreso' && t.concepto?.toLowerCase().startsWith('seña');

  const esSaldo = (t: TransaccionCaja) =>
    t.tipo === 'ingreso' && !esSeña(t) && t.reserva_id; // ingresos de reservas no marcados como seña

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
      cajaStorage.registrarIngres
