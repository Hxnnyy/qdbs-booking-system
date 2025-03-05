
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileUp, Clipboard, CalendarPlus } from 'lucide-react';
import { BatchEntryForm } from '@/components/admin/BatchEntryForm';
import { ImportFromCsv } from '@/components/admin/ImportFromCsv';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';

const ImportBookings = () => {
  const [activeTab, setActiveTab] = useState<string>('batch-entry');
  const { barbers, isLoading: isLoadingBarbers } = useBarbers();
  const { services, isLoading: isLoadingServices } = useServices();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Import Bookings</h1>
            <Button variant="outline" size="sm" onClick={() => window.open('/admin/bookings', '_blank')}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              View Bookings
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Import Existing Bookings</CardTitle>
              <CardDescription>
                Quickly add bookings from your previous system to Queens Dock Barbershop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="batch-entry" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="batch-entry">
                    <Clipboard className="mr-2 h-4 w-4" />
                    Manual Entry
                  </TabsTrigger>
                  <TabsTrigger value="csv-import">
                    <FileUp className="mr-2 h-4 w-4" />
                    CSV Import
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="batch-entry" className="space-y-4 py-4">
                  {(isLoadingBarbers || isLoadingServices) ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <BatchEntryForm barbers={barbers} services={services} />
                  )}
                </TabsContent>
                
                <TabsContent value="csv-import" className="space-y-4 py-4">
                  <ImportFromCsv barbers={barbers} services={services} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default ImportBookings;
