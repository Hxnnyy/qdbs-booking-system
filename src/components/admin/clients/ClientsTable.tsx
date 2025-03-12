
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Client } from '@/types/client';
import { useClients } from '@/context/ClientsContext';

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, isLoading }) => {
  const { 
    toggleClientSelection, 
    selectAllClients, 
    deselectAllClients, 
    isClientSelected 
  } = useClients();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllClients(clients);
    } else {
      deselectAllClients();
    }
  };

  const areAllSelected = clients.length > 0 && clients.every(client => isClientSelected(client.id));
  const areSomeSelected = clients.some(client => isClientSelected(client.id)) && !areAllSelected;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No clients found.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={areAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all clients"
                className={areSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Appointments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Checkbox 
                  checked={isClientSelected(client.id)}
                  onCheckedChange={() => toggleClientSelection(client.id)}
                  aria-label={`Select ${client.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.phone || 'N/A'}</TableCell>
              <TableCell>{client.email || 'N/A'}</TableCell>
              <TableCell className="text-right">{client.bookingCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
