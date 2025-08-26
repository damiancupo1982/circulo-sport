import React, { useState } from 'react';
import { Calendar, Users, DollarSign, Download, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'reservas' | 'clientes' | 'caja' | 'exportar';
  onViewChange: (view: 'reservas' | 'clientes' | 'caja' | 'exportar') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Reservas', key: 'reservas' as const, icon: Calendar },
    { name: 'Clientes', key: 'clientes' as const, icon: Users },
    { name: 'Caja', key: 'caja' as const, icon: DollarSign },
    { name: 'Exportar', key: 'exportar' as const, icon: Download }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <img 
                src="https://res.cloudinary.com/df3notxwu/image/upload/v1755824013/LOGO_BOULOGNE_yidtft.jpg" 
                alt="Círculo Sport Logo" 
                className="w-16 h-16 object-contain"
              />
              <h1 className="text-xl font-bold text-blue-600">Círculo Sport</h1>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onViewChange(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:bg-white lg:border-r lg:block">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src="https://res.cloudinary.com/df3notxwu/image/upload/v1755824013/LOGO_BOULOGNE_yidtft.jpg" 
              alt="Círculo Sport Logo" 
              className="w-20 h-20 object-contain"
            />
            <h1 className="text-2xl font-bold text-blue-600">Círculo Sport</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestión</p>
        </div>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.key}
              onClick={() => onViewChange(item.key)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                currentView === item.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <img 
              src="https://res.cloudinary.com/df3notxwu/image/upload/v1755824013/LOGO_BOULOGNE_yidtft.jpg" 
              alt="Círculo Sport Logo" 
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-lg font-bold text-blue-600">Círculo Sport</h1>
          </div>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
