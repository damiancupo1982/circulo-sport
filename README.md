# CIRCULOSPORT - Sistema de Gestión Club Deportivo

## 📋 Descripción General

Sistema de gestión integral para el Club Deportivo Círculo Sport, desarrollado en React + TypeScript con Vite. Permite administrar reservas de canchas, clientes, caja y generar reportes de manera eficiente.

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.344.0
- **Storage**: LocalStorage (navegador)
- **Deployment**: Bolt Hosting

### Estructura de Archivos

```
/
├── index.html                          # Punto de entrada HTML
├── package.json                        # Dependencias y scripts
├── vite.config.ts                      # Configuración de Vite
├── tailwind.config.js                  # Configuración de Tailwind
├── tsconfig.json                       # Configuración TypeScript (referencias)
├── tsconfig.app.json                   # Configuración TypeScript (app)
├── tsconfig.node.json                  # Configuración TypeScript (node)
├── postcss.config.js                   # Configuración PostCSS
├── eslint.config.js                    # Configuración ESLint
├── README.md                           # Este archivo
│
├── src/
│   ├── main.tsx                        # Punto de entrada React
│   ├── App.tsx                         # Componente principal con routing
│   ├── index.css                       # Estilos globales (Tailwind)
│   ├── vite-env.d.ts                   # Tipos de Vite
│   │
│   ├── components/                     # Componentes reutilizables
│   │   ├── Layout.tsx                  # Layout principal con sidebar
│   │   └── ReservaModal.tsx            # Modal para crear/editar reservas
│   │
│   ├── pages/                          # Páginas principales
│   │   ├── Reservas.tsx                # Gestión de reservas y calendario
│   │   ├── Clientes.tsx                # CRUD de clientes
│   │   ├── Caja.tsx                    # Gestión de caja y transacciones
│   │   └── Exportar.tsx                # Exportación de datos y config extras
│   │
│   ├── storage/                        # Capa de persistencia (LocalStorage)
│   │   ├── reservas.ts                 # CRUD reservas
│   │   ├── clientes.ts                 # CRUD clientes
│   │   ├── caja.ts                     # CRUD transacciones caja
│   │   └── extras.ts                   # CRUD extras disponibles
│   │
│   ├── utils/                          # Utilidades
│   │   ├── dates.ts                    # Manejo de fechas
│   │   └── export.ts                   # Exportación a CSV
│   │
│   └── types/                          # Definiciones de tipos
│       └── index.ts                    # Interfaces y tipos principales
```

## 🔧 Dependencias

### Dependencias de Producción
```json
{
  "lucide-react": "^0.344.0",     // Iconos
  "react": "^18.3.1",             // Framework principal
  "react-dom": "^18.3.1"          // DOM renderer
}
```

### Dependencias de Desarrollo
```json
{
  "@eslint/js": "^9.9.1",
  "@types/react": "^18.3.5",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.3.1",
  "autoprefixer": "^10.4.18",
  "eslint": "^9.9.1",
  "eslint-plugin-react-hooks": "^5.1.0-rc.0",
  "eslint-plugin-react-refresh": "^0.4.11",
  "globals": "^15.9.0",
  "postcss": "^8.4.35",
  "tailwindcss": "^3.4.1",
  "typescript": "^5.5.3",
  "typescript-eslint": "^8.3.0",
  "vite": "^5.4.2"
}
```

## 📊 Modelo de Datos

### Interfaces Principales

```typescript
// Cliente
interface Cliente {
  id: string;
  numero_socio: string;        // Auto-generado: YY-NN
  nombre: string;
  telefono: string;
  created_at: Date;
}

// Reserva
interface Reserva {
  id: string;
  cancha_id: string;           // Referencia a CANCHAS
  cliente_id: string;
  cliente_nombre: string;
  fecha: string;               // YYYY-MM-DD
  hora_inicio: string;         // HH:MM
  hora_fin: string;            // HH:MM
  metodo_pago: 'efectivo' | 'transferencia' | 'pendiente';
  precio_base: number;
  extras: Extra[];
  items_libres: ItemLibre[];
  total: number;               // Calculado automáticamente
  estado: 'confirmada' | 'cancelada';
  seña?: string;               // Comentarios opcionales
  created_at: Date;
}

// Transacción de Caja
interface TransaccionCaja {
  id: string;
  tipo: 'ingreso' | 'retiro';
  concepto: string;
  monto: number;
  fecha_hora: Date;
  reserva_id?: string;         // Opcional, para ingresos de reservas
  metodo_pago?: 'efectivo' | 'transferencia' | 'pendiente';
}

// Extra
interface Extra {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

// Item Libre
interface ItemLibre {
  id: string;
  descripcion: string;
  precio: number;
}

// Cancha (constantes)
interface Cancha {
  id: string;
  nombre: string;
  tipo: 'futbol-5' | 'futbol-8' | 'futbol-2' | 'padel';
  precio_base: number;
  color: string;               // Clase CSS para colores
}
```

### Canchas Configuradas
```typescript
const CANCHAS = [
  { id: 'futbol-5-1', nombre: 'Fútbol 5', precio_base: 8000, color: 'bg-blue-500' },
  { id: 'futbol-8-1', nombre: 'Fútbol 8', precio_base: 12000, color: 'bg-green-500' },
  { id: 'futbol-2-1', nombre: 'Fútbol 2', precio_base: 5000, color: 'bg-orange-500' },
  { id: 'padel-1', nombre: 'Pádel 1', precio_base: 10000, color: 'bg-purple-500' },
  { id: 'padel-2', nombre: 'Pádel 2', precio_base: 10000, color: 'bg-pink-500' }
];
```

## 🎯 Funcionalidades por Módulo

### 1. Reservas (`/src/pages/Reservas.tsx`)
- **Calendario visual**: Grilla de horarios por cancha
- **CRUD completo**: Crear, editar, eliminar reservas
- **Gestión de conflictos**: Validación de disponibilidad
- **Estados**: Confirmada, pendiente, cancelada
- **Métodos de pago**: Efectivo, transferencia, pendiente
- **Extras y items libres**: Productos adicionales
- **Protección**: Eliminación requiere contraseña (2580)

### 2. Clientes (`/src/pages/Clientes.tsx`)
- **CRUD completo**: Gestión de base de datos de clientes
- **Numeración automática**: Socios numerados por año (YY-NN)
- **Búsqueda**: Por nombre y teléfono
- **Estadísticas**: Totales y registros mensuales
- **Datos iniciales**: 5 clientes de ejemplo

### 3. Caja (`/src/pages/Caja.tsx`)
- **Resúmenes financieros**: Total caja, efectivo, transferencias
- **Transacciones por día**: Navegación por fechas
- **Retiros protegidos**: Contraseña requerida (2580)
- **Actualización automática**: Cada 2 segundos
- **Integración**: Automática con reservas confirmadas
- **Filtros**: Por método de pago y fecha

### 4. Exportar (`/src/pages/Exportar.tsx`)
- **Exportación CSV**: Reservas, clientes, transacciones
- **Configuración extras**: CRUD de productos adicionales
- **Estadísticas generales**: Resumen del sistema
- **Formato compatible**: Excel y aplicaciones similares

## 🔄 Flujo de Datos

### Persistencia
- **LocalStorage**: Todas las claves prefijadas con `circulo-sport-`
- **Claves utilizadas**:
  - `circulo-sport-reservas`: Array de reservas
  - `circulo-sport-clientes`: Array de clientes
  - `circulo-sport-caja`: Array de transacciones
  - `circulo-sport-extras`: Array de extras disponibles

### Sincronización Automática
1. **Reserva confirmada** → **Transacción en caja**
2. **Reserva eliminada** → **Transacción eliminada**
3. **Cambio pendiente→pagado** → **Nueva transacción**

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Pasos de Instalación
```bash
# 1. Clonar/crear proyecto
npm create vite@latest circulo-sport -- --template react-ts

# 2. Instalar dependencias principales
npm install lucide-react@^0.344.0

# 3. Instalar dependencias de desarrollo
npm install -D tailwindcss@^3.4.1 autoprefixer@^10.4.18 postcss@^8.4.35

# 4. Configurar Tailwind
npx tailwindcss init -p

# 5. Copiar estructura de archivos según este README

# 6. Ejecutar en desarrollo
npm run dev

# 7. Build para producción
npm run build
```

### Configuraciones Importantes

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

#### `tailwind.config.js`
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

#### `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🔐 Seguridad

### Contraseñas del Sistema
- **Eliminación de reservas**: `2580`
- **Retiros de caja**: `2580`

### Validaciones
- **Disponibilidad de horarios**: Previene doble reserva
- **Fondos suficientes**: Retiros no pueden exceder efectivo disponible
- **Datos requeridos**: Validación de formularios
- **Estados consistentes**: Transiciones de estado controladas

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (sidebar colapsable)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (sidebar fijo)

### Componentes Adaptativos
- **Layout**: Sidebar responsive con menú hamburguesa
- **Tablas**: Scroll horizontal en móviles
- **Modales**: Adaptación automática al viewport
- **Grilla de reservas**: Scroll horizontal preservando usabilidad

## 🎨 Sistema de Colores

### Canchas
- **Fútbol 5**: Azul (`bg-blue-500`)
- **Fútbol 8**: Verde (`bg-green-500`)
- **Fútbol 2**: Naranja (`bg-orange-500`)
- **Pádel 1**: Púrpura (`bg-purple-500`)
- **Pádel 2**: Rosa (`bg-pink-500`)

### Estados
- **Confirmada**: Verde (`bg-green-50`, `border-green-400`)
- **Pendiente**: Amarillo (`bg-yellow-50`, `border-yellow-400`)
- **Cancelada**: Rojo (`bg-red-50`, `border-red-400`)

## 🔧 Scripts Disponibles

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "vite build",            // Build de producción
  "lint": "eslint .",               // Linting
  "preview": "vite preview"         // Preview del build
}
```

## 📈 Características Avanzadas

### Auto-actualización
- **Caja**: Refresco cada 2 segundos
- **Reservas**: Recarga al cambiar fecha
- **Clientes**: Actualización tras operaciones CRUD

### Generación Automática
- **IDs únicos**: Timestamp + random string
- **Números de socio**: Formato YY-NN automático
- **Totales**: Cálculo dinámico en tiempo real

### Exportación Inteligente
- **Formato CSV**: Compatible con Excel
- **Encoding UTF-8**: Caracteres especiales
- **Nombres descriptivos**: Incluye fecha de exportación
- **Headers en español**: Fácil comprensión

## 🐛 Debugging y Logs

### Console Logs
- Errores de storage capturados y logueados
- Operaciones CRUD trackeadas
- Estados de carga visibles

### Manejo de Errores
- Try-catch en todas las operaciones de storage
- Fallbacks para datos corruptos
- Mensajes de error user-friendly

## 🚀 Deployment

### Bolt Hosting (Actual)
- Build automático con `npm run build`
- Servido como sitio estático
- URL: `https://damiancupo4-ui-circu-gkyz.bolt.host`

### Alternativas
- **Netlify**: Drag & drop de carpeta `dist/`
- **Vercel**: Conexión con repositorio Git
- **GitHub Pages**: Para repositorios públicos

## 📝 Notas para Desarrolladores

### Patrones Utilizados
- **Custom Hooks**: Para lógica reutilizable
- **Compound Components**: Modal con subcomponentes
- **Render Props**: Para componentes flexibles
- **State Lifting**: Estado compartido en componentes padre

### Convenciones
- **Naming**: camelCase para variables, PascalCase para componentes
- **Files**: kebab-case para archivos, PascalCase para componentes
- **Types**: Interfaces en PascalCase, tipos en camelCase
- **Constants**: UPPER_SNAKE_CASE

### Extensibilidad
- **Nuevas canchas**: Agregar a array `CANCHAS`
- **Nuevos extras**: CRUD completo implementado
- **Nuevos métodos de pago**: Extender union types
- **Nuevos reportes**: Utilizar funciones de `exportUtils`

---

## 📞 Información del Proyecto

**Nombre**: CIRCULOSPORT - Sistema de Gestión  
**Versión**: 1.0.0  
**Autor**: Sistema desarrollado para Club Deportivo Círculo Sport  
**Tecnología**: React + TypeScript + Vite + Tailwind CSS  
**Licencia**: Uso interno del club  

---

*Este README contiene toda la información necesaria para replicar, mantener y extender el sistema. Cualquier IA puede utilizar esta documentación para comprender completamente la arquitectura y funcionalidades del proyecto.*