
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ServiceType } from '@/types/supabase';

const ManageServices = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('services' as any)
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setServices(data || []);
    } catch (error: any) {
      toast.error('Error fetching services: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setActive(true);
    setEditingService(null);
  };

  const handleEditService = (service: ServiceType) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setActive(service.active);
    setShowForm(true);
  };

  const handleAddNewService = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !price || !duration) {
      toast.error('All fields are required');
      return;
    }
    
    if (isNaN(Number(price)) || isNaN(Number(duration))) {
      toast.error('Price and duration must be numbers');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const serviceData = {
        name,
        description,
        price: Number(price),
        duration: Number(duration),
        active
      };
      
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services' as any)
          .update(serviceData as any)
          .eq('id', editingService.id);
        
        if (error) throw error;
        
        toast.success('Service updated successfully');
      } else {
        // Create new service
        const { error } = await supabase
          .from('services' as any)
          .insert(serviceData as any);
        
        if (error) throw error;
        
        toast.success('Service added successfully');
      }
      
      resetForm();
      setShowForm(false);
      fetchServices();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-playfair">Manage Services</h1>
          <Button 
            onClick={handleAddNewService}
            className="bg-burgundy hover:bg-burgundy-light"
          >
            Add New Service
          </Button>
        </div>
        
        {showForm && (
          <Card className="mb-8 glass shadow-subtle border border-border">
            <CardHeader>
              <CardTitle>{editingService ? 'Edit Service' : 'Add New Service'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Haircut & Style"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="A brief description of the service"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (£) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="29.99"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input 
                      id="duration" 
                      type="number" 
                      min="5" 
                      step="5"
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      placeholder="30"
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active" 
                    checked={active} 
                    onCheckedChange={setActive} 
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-burgundy hover:bg-burgundy-light"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Saving...
                      </>
                    ) : (
                      editingService ? 'Update Service' : 'Add Service'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-12 h-12" />
          </div>
        ) : services.length === 0 ? (
          <Card className="glass shadow-subtle border border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No services found</p>
              <Button 
                onClick={handleAddNewService}
                className="bg-burgundy hover:bg-burgundy-light"
              >
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card 
                key={service.id} 
                className={`glass shadow-subtle border ${service.active ? 'border-border' : 'border-red-200 bg-red-50/30'}`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center">
                          {service.name}
                          {!service.active && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Inactive
                            </span>
                          )}
                        </h2>
                        <div className="font-semibold text-burgundy">
                          £{service.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-muted-foreground">{service.description}</p>
                        <p className="text-muted-foreground">{service.duration} min</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleEditService(service)}
                      className="ml-4"
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageServices;
