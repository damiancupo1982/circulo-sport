import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User } from 'lucide-react';
import { Cliente } from '../types';
import { clientesStorage } from '../storage/clientes';

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = () => {
    setClientes(clientesStorage.getAll());
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.telefono.includes(searchQuery)
  );

  const handleSaveCliente = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const cliente: Cliente = {
      id: selectedCliente?.id || `cli-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: formData.get('nombre') as string,
      telefono: formData.get('telefono') as string,
      created_at: selectedCliente?.created_at || new Date()
    };

    clientesStorage.save(cliente);
    loadClientes();
    setModalOpen(false);
    setSelectedCliente(undefined);
  };

  const handleDeleteCliente = (cliente: Cliente) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${cliente.nombre}?`)) {
      clientesStorage.delete(cliente.id);
      loadClientes();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => {
            setSelectedCliente(undefined);
            setModalOpen(true);
          }}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredClientes.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="text-gray-500">
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Agrega tu primer cliente para empezar'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClientes.map(cliente => (
              <div key={cliente.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {cliente.nombre}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Socio {cliente.numero_socio}</span>
                        <span>•</span>
                        <span>{cliente.telefono}</span>
                        <span>•</span>
                        <span>
                          Registrado el {cliente.created_at.toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setModalOpen(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{clientes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Este Mes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {clientes.filter(c => {
                  const clienteDate = new Date(c.created_at);
                  const now = new Date();
                  return clienteDate.getMonth() === now.getMonth() && 
                         clienteDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Search className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resultados</p>
              <p className="text-2xl font-semibold text-gray-900">{filteredClientes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setModalOpen(false)} />
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>

              <form onSubmit={handleSaveCliente} className="space-y-4">
                {selectedCliente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de socio
                    </label>
                    <input
                      type="text"
                      value={selectedCliente.numero_socio}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={selectedCliente?.nombre || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    defaultValue={selectedCliente?.telefono || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
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
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {selectedCliente ? 'Actualizar' : 'Crear'} Cliente
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