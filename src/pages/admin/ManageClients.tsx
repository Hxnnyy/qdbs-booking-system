
import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { ClientsManagement } from '@/components/admin/clients/ClientsManagement';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ClientsProvider } from '@/context/ClientsContext';

export default function ManageClients() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>Clients</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Manage Clients</h1>
          <p className="text-muted-foreground">
            View and manage client information, send emails to clients.
          </p>
        </div>
        
        <ClientsProvider>
          <ClientsManagement />
        </ClientsProvider>
      </div>
    </AdminLayout>
  );
}
