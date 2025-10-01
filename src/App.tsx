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