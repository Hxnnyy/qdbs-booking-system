
import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBarberColor, setBarberColor } from '@/utils/calendarUtils';
import { toast } from 'sonner';

const SetupShop = () => {
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [barberColors, setBarberColors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Initialize barber colors based on current defaults
  useEffect(() => {
    if (barbers.length > 0) {
      const colors: Record<string, string> = {};
      barbers.forEach(barber => {
        colors[barber.id] = getBarberColor(barber.id, barber.name);
      });
      setBarberColors(colors);
    }
  }, [barbers]);

  const handleColorChange = (barberId: string, color: string) => {
    // Update local state
    setBarberColors(prev => ({
      ...prev,
      [barberId]: color
    }));
    
    // Update the color in the utility
    setBarberColor(barberId, color);
    
    toast.success(`Updated color for ${barbers.find(b => b.id === barberId)?.name || 'barber'}`);
  };

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
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="services">
                        <BarberServicesForm barberId={selectedBarber} />
                      </TabsContent>
                      
                      <TabsContent value="hours">
                        <OpeningHoursForm barberId={selectedBarber} />
                      </TabsContent>
                      
                      <TabsContent value="appearance">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Calendar Appearance</h3>
                          <div className="grid gap-4 max-w-md">
                            <div className="space-y-2">
                              <Label htmlFor="calendarColor">Calendar Color</Label>
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-8 h-8 rounded-full border"
                                  style={{ backgroundColor: barberColors[selectedBarber] || '#000000' }}
                                />
                                <Input
                                  id="calendarColor"
                                  type="color"
                                  value={barberColors[selectedBarber] || '#000000'}
                                  onChange={(e) => handleColorChange(selectedBarber, e.target.value)}
                                  className="w-24 h-10 p-1"
                                />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                This color will be used for this barber's appointments on the calendar.
                              </p>
                            </div>
                          </div>
                        </div>
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
