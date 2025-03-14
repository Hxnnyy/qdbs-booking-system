
import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { ClientsManagement } from '@/components/admin/clients/ClientsManagement';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ClientsProvider } from '@/context/ClientsContext';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';

export default function ManageClients() {
  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
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
      </motion.div>
    </AdminLayout>
  );
}
