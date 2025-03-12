
import { useState } from 'react';
import { Client } from '@/types/client';
import { useClientsFetch } from './clients/useClientsFetch';
import { useClientUpdate } from './clients/useClientUpdate';
import { useClientEmail } from './clients/useClientEmail';
import { useClientExport } from './clients/useClientExport';

export const useClientManagement = () => {
  const { 
    clients, 
    isLoading, 
    fetchClients, 
    showGuestBookings, 
    toggleShowGuestBookings 
  } = useClientsFetch();
  
  const { updateClientProfile } = useClientUpdate();
  const { sendEmailToClients } = useClientEmail();
  const { exportClientsData } = useClientExport();

  return {
    clients,
    isLoading,
    fetchClients,
    sendEmailToClients,
    showGuestBookings,
    toggleShowGuestBookings,
    updateClientProfile,
    exportClientsData
  };
};
