
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientsTable } from './ClientsTable';
import { ClientsEmailDialog } from './ClientsEmailDialog';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, Users } from 'lucide-react';
import { useClientManagement } from '@/hooks/useClientManagement';
import { useClients } from '@/context/ClientsContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const ClientsManagement = () => {
  const { 
    clients, 
    isLoading, 
    fetchClients, 
    sendEmailToClients, 
    showGuestBookings, 
    toggleShowGuestBookings 
  } = useClientManagement();
  const { selectedClients, deselectAllClients } = useClients();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleRefresh = () => {
    fetchClients();
  };

  const handleSendEmail = () => {
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  const handleSendEmailSubmit = async (subject: string, content: string) => {
    // Get emails of selected clients
    const selectedClientEmails = clients
      .filter(client => selectedClients.includes(client.id) && client.email)
      .map(client => client.email as string);
    
    if (selectedClientEmails.length === 0) {
      return false;
    }
    
    const success = await sendEmailToClients(selectedClientEmails, subject, content);
    if (success) {
      setEmailDialogOpen(false);
      deselectAllClients();
    }
    return success;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Client List</CardTitle>
          <div className="flex gap-2 items-center">
            <div className="flex items-center space-x-2 mr-4">
              <Switch 
                id="show-guests" 
                checked={showGuestBookings}
                onCheckedChange={toggleShowGuestBookings}
              />
              <Label htmlFor="show-guests">Show Guest Bookings</Label>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={selectedClients.length === 0}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ClientsTable clients={clients} isLoading={isLoading} />
        
        <ClientsEmailDialog 
          isOpen={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          onSend={handleSendEmailSubmit}
          selectedClientsCount={selectedClients.length}
        />
      </CardContent>
    </Card>
  );
};
