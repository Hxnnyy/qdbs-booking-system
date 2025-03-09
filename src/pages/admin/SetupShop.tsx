
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useBarbers } from '@/hooks/useBarbers';
import { OpeningHoursForm } from '@/components/admin/OpeningHoursForm';
import { BarberServicesForm } from '@/components/admin/BarberServicesForm';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const SetupShop = () => {
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Shop Setup</h1>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => navigate('/admin/barbers')}
              >
                Manage Barbers
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/admin/services')}
              >
                Manage Services
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configure Barber Services & Hours</CardTitle>
              <CardDescription>
                Set up the services each barber offers and their working hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {barbersLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="w-8 h-8" />
                </div>
              ) : barbers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No barbers found. Add barbers first.</p>
                  <Button onClick={() => navigate('/admin/barbers')}>
                    Add Barbers
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">
                      Select Barber
                    </label>
                    <Select 
                      value={selectedBarber || ''} 
                      onValueChange={setSelectedBarber}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Select a barber to configure" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers.map(barber => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedBarber && (
                    <Tabs defaultValue="services">
                      <TabsList className="mb-6">
                        <TabsTrigger value="services">Services</TabsTrigger>
                        <TabsTrigger value="hours">Opening Hours</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="services">
                        <BarberServicesForm barberId={selectedBarber} />
                      </TabsContent>
                      
                      <TabsContent value="hours">
                        <OpeningHoursForm barberId={selectedBarber} />
                      </TabsContent>
                    </Tabs>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default SetupShop;
