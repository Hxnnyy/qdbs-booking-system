import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientsTable } from './ClientsTable';
import { ClientsEmailDialog } from './ClientsEmailDialog';
import { EditClientDialog } from './EditClientDialog';
import { ExportClientsDialog } from './ExportClientsDialog';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, FileSpreadsheet, Search } from 'lucide-react';
import { useClientManagement } from '@/hooks/useClientManagement';
import { useClients } from '@/context/ClientsContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/client';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

export const ClientsManagement = () => {
  const { 
    clients, 
    isLoading, 
    fetchClients, 
    sendEmailToClients, 
    showGuestBookings, 
    toggleShowGuestBookings,
    updateClientProfile,
    exportClientsData
  } = useClientManagement();
  const { selectedClients, deselectAllClients } = useClients();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefresh = () => {
    fetchClients();
  };

  const handleSendEmail = () => {
    setEmailDialogOpen(true);
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  const handleEditClient = (client: Client) => {
    setClientToEdit(client);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setClientToEdit(null);
  };

  const handleSendEmailSubmit = async (subject: string, content: string) => {
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

  const handleExportSubmit = (fields: string[]) => {
    const clientsToExport = clients.filter(client => selectedClients.includes(client.id));
    
    if (clientsToExport.length > 0) {
      exportClientsData(clientsToExport, fields);
      setExportDialogOpen(false);
      deselectAllClients();
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    
    return (
      (client.name && client.name.toLowerCase().includes(term)) ||
      (client.email && client.email.toLowerCase().includes(term)) ||
      (client.phone && client.phone.toLowerCase().includes(term))
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Client List</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
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
                variant="outline"
                onClick={handleExport} 
                disabled={selectedClients.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export
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
          
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ClientsTable 
            clients={filteredClients} 
            isLoading={isLoading} 
            onEditClient={handleEditClient} 
          />
          
          <ClientsEmailDialog 
            isOpen={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            onSend={handleSendEmailSubmit}
            selectedClientsCount={selectedClients.length}
          />

          <EditClientDialog
            isOpen={editDialogOpen}
            onClose={handleCloseEditDialog}
            client={clientToEdit}
            onSave={updateClientProfile}
            isLoading={isLoading}
          />

          <ExportClientsDialog
            isOpen={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            onExport={handleExportSubmit}
            selectedClientsCount={selectedClients.length}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};
