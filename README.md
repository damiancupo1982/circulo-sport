# Sistema de Gestión - Círculo Sport

## Descripción General

Sistema web completo para la gestión de reservas de canchas de pádel, administración de clientes, control de caja y generación de reportes. Desarrollado con React + TypeScript + Vite, utilizando localStorage para persistencia de datos.

## Características Principales

- **Gestión de Reservas**: Sistema de calendario visual con soporte para reservas únicas y recurrentes
- **Control de Caja**: Seguimiento completo de ingresos y egresos con métodos de pago diferenciados
- **Administración de Clientes**: Base de datos de clientes con asignación automática de números de socio
- **Sistema de Señas**: Manejo de anticipos para reservas con impacto selectivo en caja
- **Cierre de Turno**: Generación automática de reportes de cierre con exportación PDF/CSV
- **Backup/Restore**: Sistema completo de respaldo y restauración de datos
- **Exportación de Datos**: Múltiples opciones de exportación en formato CSV

---

## Estructura del Proyecto

```
/tmp/cc-agent/57802071/project/
├── .env                          # Variables de entorno
├── .gitignore                    # Archivos ignorados por git
├── package.json                  # Dependencias del proyecto
├── vite.config.ts               # Configuración de Vite
├── tailwind.config.js           # Configuración de Tailwind CSS
├── tsconfig.json                # Configuración de TypeScript
├── index.html                   # HTML principal
│
├── src/
│   ├── main.tsx                 # Punto de entrada de la aplicación
│   ├── App.tsx                  # Componente principal con navegación
│   ├── index.css                # Estilos globales
│   ├── types.ts                 # Definiciones de tipos principales
│   │
│   ├── assets/                  # Recursos estáticos
│   │   └── WhatsApp Image 2025-08-21 at 00.58.21_4c69169a.jpg
│   │
│   ├── components/              # Componentes reutilizables
│   │   ├── Layout.tsx           # Layout principal con sidebar
│   │   ├── ReservaModal.tsx     # Modal para crear/editar reservas
│   │   ├── ReservasListado.tsx  # Listado filtrable de reservas
│   │   ├── CierreTurno.tsx      # Modal de visualización de cierre
│   │   └── ConsultaCierres.tsx  # Consulta histórica de cierres
│   │
│   ├── pages/                   # Páginas principales
│   │   ├── Reservas.tsx         # Vista de calendario de reservas
│   │   ├── Clientes.tsx         # Gestión de clientes
│   │   ├── Caja.tsx             # Control de caja
│   │   └── Exportar.tsx         # Exportación y backup
│   │
│   ├── storage/                 # Capa de persistencia (localStorage)
│   │   ├── reservas.ts          # Gestión de reservas
│   │   ├── clientes.ts          # Gestión de clientes
│   │   ├── caja.ts              # Gestión de transacciones
│   │   ├── cierres.ts           # Gestión de cierres de turno
│   │   └── extras.ts            # Gestión de extras/productos
│   │
│   ├── utils/                   # Utilidades
│   │   ├── export.ts            # Exportación a CSV
│   │   ├── dates.ts             # Utilidades de fechas
│   │   ├── cierreUtils.ts       # Generación de cierres
│   │   └── backup.ts            # Backup y restore
│   │
│   └── types/
│       └── index.ts             # Tipos TypeScript centralizados
│
└── .bolt/                       # Configuración de Bolt
    ├── config.json
    └── prompt
```

---

## Tipos de Datos Principales

### 1. Reserva (src/types.ts)

```typescript
interface Reserva {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  cancha_id: string;
  fecha: string;                    // "YYYY-MM-DD"
  hora_inicio: string;              // "HH:MM"
  hora_fin: string;                 // "HH:MM"
  metodo_pago: 'efectivo' | 'transferencia' | 'pendiente';
  precio_base: number;
  extras: Extra[];
  items_libres: ItemLibre[];
  total: number;
  estado: 'confirmada' | 'pendiente' | 'cancelada';
  seña?: string;                    // Comentario de seña
  seña_monto?: number;              // Monto de seña
  seña_metodo?: 'efectivo' | 'transferencia';
  seña_aplica_caja?: boolean;       // Si impacta en caja (true solo en primera reserva)
  created_at: Date;
}
```

### 2. Cliente (src/types.ts)

```typescript
interface Cliente {
  id: string;
  numero_socio: string;             // Formato: "YY-NN" (ej: "25-01")
  nombre: string;
  telefono: string;
  created_at: Date;
}
```

### 3. TransaccionCaja (src/types.ts)

```typescript
interface TransaccionCaja {
  id: string;
  tipo: 'ingreso' | 'retiro';
  concepto: string;
  monto: number;
  fecha_hora: Date;
  reserva_id?: string;
  metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente';
}
```

### 4. CierreTurno (src/types.ts)

```typescript
interface CierreTurno {
  id: string;
  usuario: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  duracion_minutos: number;
  totales: {
    efectivo: number;
    transferencias: number;
    expensas: number;
    total_general: number;
  };
  cantidad_ventas: number;
  transacciones: Array<{
    fecha: string;
    cliente_nombre: string;
    cancha: string;
    horario_desde: string;
    horario_hasta: string;
    importe: number;
    metodo_pago: string;
  }>;
  reservas_detalle: Reserva[];
  created_at: Date;
}
```

### 5. Cancha (src/types.ts)

```typescript
interface Cancha {
  id: string;
  nombre: string;
  precio_base: number;
  color: string;                    // Clase CSS de color
}

// Configuración de canchas
const CANCHAS: Cancha[] = [
  { id: '1', nombre: 'Cancha 1', precio_base: 20000, color: 'bg-blue-500' },
  { id: '2', nombre: 'Cancha 2', precio_base: 20000, color: 'bg-green-500' },
  { id: '3', nombre: 'Cancha 3', precio_base: 20000, color: 'bg-orange-500' }
];
```

---

## Archivos Principales

### 1. App.tsx - Componente Principal

```typescript
// src/App.tsx
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Reservas } from './pages/Reservas';
import { Clientes } from './pages/Clientes';
import { Caja } from './pages/Caja';
import { Exportar } from './pages/Exportar';

function App() {
  const [currentView, setCurrentView] = useState<'reservas' | 'clientes' | 'caja' | 'exportar'>('reservas');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'reservas':
        return <Reservas />;
      case 'clientes':
        return <Clientes />;
      case 'caja':
        return <Caja />;
      case 'exportar':
        return <Exportar />;
      default:
        return <Reservas />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  );
}

export default App;
```

### 2. Layout.tsx - Navegación Principal

**Ubicación**: `src/components/Layout.tsx`

**Funcionalidad**:
- Sidebar con navegación entre secciones
- Logo y branding del club
- Diseño responsive con menú móvil
- Iconos de lucide-react para cada sección

### 3. Reservas.tsx - Gestión de Reservas

**Ubicación**: `src/pages/Reservas.tsx`

**Características**:
- Vista de calendario con grilla de horarios
- Colores diferenciados por estado (pendiente/confirmada/pasada)
- Click en slot para crear reserva o ver existente
- Selector de fecha con navegación
- Listado de reservas del día
- Protección por contraseña para eliminación (PIN: 2580)

### 4. ReservaModal.tsx - Modal de Reserva

**Ubicación**: `src/components/ReservaModal.tsx`

**Funcionalidad Completa**:
- Selección de cancha, cliente, fecha y horario
- Autocompletado de clientes con búsqueda
- Creación rápida de nuevo cliente desde el modal
- Gestión de extras (productos adicionales)
- Items libres para conceptos personalizados
- Sistema de señas con monto y método
- **Reservas semanales**: Opción de generar reservas recurrentes hasta fin de mes
- Validación de disponibilidad en tiempo real
- Confirmación de pago para reservas pendientes

### 5. Caja.tsx - Control de Caja

**Ubicación**: `src/pages/Caja.tsx`

**Funcionalidades Principales**:

```typescript
// Helpers de fecha/hora en LOCAL (evita desfasajes UTC)
function toInputDateTimeLocal(d: Date): string
function toLocalISO(d: Date): string

// Estado principal
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
```

**Características**:
- Resumen de totales en tiempo real
- Desglose por método de pago
- Diferenciación entre señas y saldos
- Registro manual de ingresos/retiros
- Protección por contraseña para retiros (PIN: 2580)
- Actualización automática cada 2 segundos
- Navegación por fechas
- Cierre de turno con generación de reportes

### 6. Clientes.tsx - Gestión de Clientes

**Ubicación**: `src/pages/Clientes.tsx`

**Características**:
- Búsqueda por nombre o teléfono
- Generación automática de número de socio (formato: YY-NN)
- Estadísticas: total, nuevos este mes, resultados filtrados
- CRUD completo de clientes

### 7. Exportar.tsx - Backup y Exportación

**Ubicación**: `src/pages/Exportar.tsx`

**Funcionalidades**:

1. **Exportación CSV**:
   - Reservas (incluye campos de seña)
   - Clientes
   - Transacciones (con tipo_movimiento: SEÑA/SALDO/MANUAL/RETIRO)

2. **Backup/Restore**:
   - Generación de archivo JSON único con todos los datos
   - Filtrado opcional por rango de fechas (aplica a Reservas y Caja)
   - Guardado con File System Access API o descarga estándar
   - Importación con reemplazo total de datos
   - Recordatorio configurable cada N días

3. **Configuración de Extras**:
   - Gestión de productos/servicios adicionales
   - CRUD completo

---

## Storage (Persistencia de Datos)

Todos los módulos de storage utilizan localStorage con el prefijo `circulo-sport-*`:

### reservas.ts

**Clave**: `circulo-sport-reservas`

**Métodos principales**:
```typescript
getAll(): Reserva[]
getByDate(fecha: string): Reserva[]
getById(id: string): Reserva | null
save(reserva: Reserva): void
delete(id: string): void
isSlotAvailable(cancha_id, fecha, hora_inicio, hora_fin, excludeId?): boolean
```

**Nota importante**: Al eliminar una reserva, también elimina las transacciones de caja relacionadas.

### clientes.ts

**Clave**: `circulo-sport-clientes`

**Métodos principales**:
```typescript
getAll(): Cliente[]
getById(id: string): Cliente | null
searchByName(query: string): Cliente[]
save(cliente: Cliente): void
delete(id: string): void
```

**Generación de número de socio**: Formato YY-NN (año + número secuencial del año)

### caja.ts

**Clave**: `circulo-sport-caja`

**Funciones de fecha seguras**:
```typescript
function ymdLocal(d: Date): string  // Convierte a YYYY-MM-DD local
function toDateSafe(v: any): Date   // Parse seguro a Date
function n(x: any): number          // Número seguro
```

**Métodos principales**:
```typescript
getAll(): TransaccionCaja[]
getByDate(fechaYmdLocal: string): TransaccionCaja[]
getTotalCaja(): number
getTotalEfectivo(): number
getTotalTransferencia(): number
getIngresosPorDia(fechaYmdLocal: string): number
getIngresosPorDiaYMetodo(fecha, metodo): number
getRetirosPorDia(fechaYmdLocal: string): number
registrarIngreso(concepto, monto, reserva_id?, metodo_pago?): void
registrarRetiro(concepto, monto): void
save(transaccion: TransaccionCaja): void
delete(id: string): void
deleteByReservaId(reserva_id: string): void
```

**Nota**: Los retiros siempre son de efectivo. No se registran ingresos con método 'pendiente'.

### cierres.ts

**Clave**: `circulo-sport-cierres`

**Métodos principales**:
```typescript
getAll(): CierreTurno[]
save(cierre: CierreTurno): void
getByDateRange(desde: Date, hasta: Date): CierreTurno[]
getByUsuario(usuario: string): CierreTurno[]
delete(id: string): void
```

### extras.ts

**Clave**: `circulo-sport-extras`

**Métodos principales**:
```typescript
getAll(): ExtraDisponible[]
save(extra: ExtraDisponible): void
delete(id: string): void
initializeDefaultExtras(): void  // Carga extras por defecto
```

**Extras por defecto**:
- Alquiler de paletas: $2000
- Tubo de pelotas: $3000
- Cubre grips: $1000
- Protectores: $1500

---

## Utilidades

### export.ts

**Ubicación**: `src/utils/export.ts`

**Funciones**:
```typescript
exportReservas(): void             // Exporta todas las reservas
exportClientes(): void             // Exporta todos los clientes
exportTransacciones(): void        // Exporta todas las transacciones
exportReservasCustom(reservas: Reserva[], suffix): void  // Exporta conjunto filtrado
```

**Formato CSV**: UTF-8, separado por comas, con headers descriptivos.

### dates.ts

**Ubicación**: `src/utils/dates.ts`

```typescript
formatDate(date: Date): string              // YYYY-MM-DD
formatDisplayDate(date: Date): string       // Formato legible español
addDays(date: Date, days: number): Date     // Suma/resta días
parseDate(dateString: string): Date         // Parse de YYYY-MM-DD
isToday(date: Date): boolean                // Verifica si es hoy
```

### cierreUtils.ts

**Ubicación**: `src/utils/cierreUtils.ts`

**Funciones principales**:
```typescript
generarCierre(usuario, fechaInicio, fechaFin): CierreTurno
exportToPDF(cierre: CierreTurno): void
exportToCSV(cierre: CierreTurno): void
generatePrintableContent(cierre: CierreTurno): string
```

**Proceso de generación de cierre**:
1. Obtiene transacciones del periodo con normalización de tipos
2. Filtra por rango temporal usando getTime()
3. Carga reservas relacionadas
4. Calcula totales por método de pago (efectivo/transferencia)
5. Genera detalle de transacciones enriquecido
6. Retorna objeto CierreTurno completo

### backup.ts

**Ubicación**: `src/utils/backup.ts`

**Interfaces**:
```typescript
interface BackupMeta {
  app: 'circulo-sport';
  version: 1;
  created_at: string;
  includes: {
    reservas: boolean;
    caja: boolean;
    clientes: boolean;
    extras: boolean;
  };
  rango?: { desde?: string; hasta?: string };
}

interface BackupFile {
  __meta: BackupMeta;
  data: Record<string, unknown>;
}

interface BackupSettings {
  remindEveryDays: number;
  lastBackupISO?: string;
}
```

**Funciones principales**:
```typescript
createBackup(options: { rango?, includes?, preferFS? }): Promise<{ ok: boolean }>
importBackupFile(file: File, mode: 'replace' | 'merge'): Promise<{ ok: boolean }>
getBackupSettings(): BackupSettings
setBackupSettings(s: BackupSettings): void
shouldRemindNow(): boolean
saveWithFS(filename, blob): Promise<void>      // File System Access API
saveWithDownload(filename, blob): void         // Descarga estándar
```

**Características del backup**:
- Filtrado por rango de fechas para reservas y caja
- Compatibilidad con File System Access API (Chrome/Edge)
- Fallback automático a descarga estándar
- Recordatorio configurable cada N días
- Modo replace (reemplaza todo) o merge (combina)

---

## Flujos de Trabajo Importantes

### 1. Creación de Reserva con Seña

```
1. Usuario abre ReservaModal
2. Completa datos: cliente, cancha, horario, etc.
3. Establece metodo_pago = 'pendiente'
4. Ingresa seña_monto y seña_metodo
5. Al guardar:
   - Se crea la reserva con seña_aplica_caja = true
   - Se registra transacción en caja con concepto "Seña..."
   - La transacción impacta en totales de caja
```

### 2. Reservas Semanales

```
1. Usuario selecciona tipo_reserva = 'semanal'
2. Completa datos de la reserva base
3. Sistema genera reservas automáticas:
   - Una por semana (mismo día/hora)
   - Hasta el final del mes actual
   - Valida disponibilidad de cada slot
4. Muestra preview con reservas disponibles y conflictos
5. Al confirmar:
   - Primera reserva: seña_aplica_caja = true (impacta caja)
   - Resto de reservas: seña_aplica_caja = false (solo informativa)
6. Guarda todas las reservas disponibles
```

### 3. Confirmación de Pago de Reserva Pendiente

```
1. Usuario edita reserva con metodo_pago = 'pendiente'
2. Cambia metodo_pago a 'efectivo' o 'transferencia'
3. Sistema muestra modal de confirmación
4. Al confirmar:
   - Actualiza reserva
   - Calcula SALDO = total - seña_monto acumulada
   - Registra transacción de SALDO en caja
   - La transacción refleja solo el saldo restante
```

### 4. Cierre de Turno

```
1. Usuario hace click en "Cerrar Turno"
2. Ingresa:
   - Nombre de usuario del turno
   - Fecha/hora de inicio del turno (datetime-local en horario LOCAL)
3. Sistema genera cierre:
   - Obtiene transacciones del periodo con normalización Date
   - Filtra por rango usando timestamps (evita problemas UTC)
   - Calcula totales por método de pago
   - Construye detalle enriquecido con datos de reservas
   - Genera objeto CierreTurno completo
4. Guarda cierre en localStorage
5. Muestra CierreTurnoModal con:
   - Resumen ejecutivo (duración, totales, cantidad ventas)
   - Desglose por método de pago
   - Tabla detallada de transacciones
   - Opciones de impresión/exportación PDF/CSV
```

### 5. Backup y Restauración

```
Backup:
1. Usuario va a página Exportar
2. Opcionalmente configura rango de fechas
3. Selecciona método (File System API o descarga)
4. Click en "Generar Backup"
5. Sistema:
   - Recopila todos los datos con prefijo 'circulo-sport-*'
   - Aplica filtrado de rango a reservas y caja
   - Genera archivo JSON con metadata
   - Guarda con método elegido (FS o download)
   - Actualiza fecha de último backup

Restore:
1. Usuario selecciona archivo .json
2. Sistema valida formato y metadata
3. Confirma reemplazo total de datos
4. Limpia localStorage y carga nuevos datos
5. Solicita recargar página para aplicar cambios
```

---

## Configuración y Contraseñas

### Contraseñas del Sistema

- **Eliminación de reservas**: `2580`
- **Retiros de caja**: `2580`

### Horarios Disponibles

Definidos en `src/types/index.ts`:

```typescript
export const HORARIOS_DISPONIBLES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
  '23:00', '23:30'
];
```

### Colores de Estado

- **Verde claro** (`bg-green-50`): Reserva futura confirmada
- **Gris** (`bg-gray-50`): Reserva pasada
- **Amarillo** (`bg-yellow-50`): Reserva pendiente de pago
- **Rojo** (`bg-red-50`): Movimiento de retiro en caja
- **Ámbar** (`bg-amber-50`): Seña registrada

---

## Instalación y Ejecución

### Requisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

### Producción

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

---

## Dependencias Principales

```json
{
  "dependencies": {
    "lucide-react": "^0.344.0",    // Iconos
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.1",       // Estilos CSS
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
```

---

## Mejoras y Consideraciones Técnicas

### Manejo de Fechas

El sistema implementa funciones especiales para evitar problemas con zonas horarias UTC:

```typescript
// Caja.tsx
function toInputDateTimeLocal(d: Date): string // Para <input type="datetime-local">
function toLocalISO(d: Date): string           // ISO en hora local

// storage/caja.ts
function ymdLocal(d: Date): string             // YYYY-MM-DD local
function toDateSafe(v: any): Date              // Parse seguro
```

### Validaciones de Seguridad

1. **Números**: `function n(x: any): number` valida y retorna 0 si no es finito
2. **Fechas**: `function toDateSafe(v: any): Date` retorna Date inválido si falla el parse
3. **Timestamps**: Siempre usa `.getTime()` para comparaciones de fechas

### Normalización de Datos

Todos los storage normalizan al cargar:
- Strings de fecha → Date objects
- Números → Number() con validación
- Preservación de estructura original

---

## Notas para IA

### Contexto del Sistema

Este es un sistema de gestión para un club de pádel que necesita:
- Controlar ocupación de 3 canchas
- Manejar reservas con anticipos (señas)
- Diferenciar entre seña y saldo en contabilidad
- Generar cierres de turno para auditoría
- Permitir backup/restore de datos sin servidor

### Particularidades Importantes

1. **Seña vs Saldo**: La seña solo impacta en caja en la PRIMERA reserva de una serie semanal
2. **Horarios Locales**: Todo el sistema trabaja en horario local para evitar confusiones
3. **Persistencia**: Solo localStorage, no hay backend
4. **Seguridad**: Contraseñas hardcodeadas (2580) solo para demo/protección básica
5. **IDs Únicos**: Formato `tipo-timestamp-random` (ej: `res-1234567890-abc123`)

### Patrón de Código

- Tipos explícitos en TypeScript
- Componentes funcionales con hooks
- Storage como servicios singleton
- Validación defensiva en capa de storage
- UI con Tailwind CSS utility-first

---

## Soporte y Mantenimiento

Este sistema fue desarrollado como una aplicación web autónoma. Para extenderlo:

1. **Agregar más canchas**: Editar array `CANCHAS` en `src/types/index.ts`
2. **Cambiar horarios**: Editar array `HORARIOS_DISPONIBLES`
3. **Modificar contraseñas**: Buscar `'2580'` en el código y reemplazar
4. **Agregar módulos**: Seguir patrón storage + page + tipos
5. **Backend**: Reemplazar localStorage con llamadas API manteniendo mismas interfaces

---

## Licencia y Créditos

Sistema desarrollado para Círculo Sport - Club de Pádel
Tecnologías: React, TypeScript, Vite, Tailwind CSS, Lucide Icons

---

**Última actualización**: 2025-09-30
**Versión del sistema**: 1.0

