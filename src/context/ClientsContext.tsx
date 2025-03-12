
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client } from '@/types/client';

interface ClientsContextType {
  selectedClients: string[];
  toggleClientSelection: (clientId: string) => void;
  selectAllClients: (clients: Client[]) => void;
  deselectAllClients: () => void;
  isClientSelected: (clientId: string) => boolean;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};

interface ClientsProviderProps {
  children: ReactNode;
}

export const ClientsProvider = ({ children }: ClientsProviderProps) => {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId) 
        : [...prev, clientId]
    );
  };

  const selectAllClients = (clients: Client[]) => {
    setSelectedClients(clients.map(client => client.id));
  };

  const deselectAllClients = () => {
    setSelectedClients([]);
  };

  const isClientSelected = (clientId: string) => {
    return selectedClients.includes(clientId);
  };

  return (
    <ClientsContext.Provider value={{
      selectedClients,
      toggleClientSelection,
      selectAllClients,
      deselectAllClients,
      isClientSelected
    }}>
      {children}
    </ClientsContext.Provider>
  );
};
