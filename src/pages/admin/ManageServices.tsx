
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Service, InsertableService, UpdatableService } from '@/supabase-types';

const ManageServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30
  });
  
  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Type assertion to avoid TypeScript errors with Supabase queries
      const { data, error } = await (supabase
        .from('services') as any)
        .select('*')
        .order('active', { ascending: false })
        .order('name');
      
      if (error) throw error;
      
      setServices(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'price' || name === 'duration' ? Number(value) : value 
    }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: 30
    });
  };
  
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newService: InsertableService = {
        ...formData,
        active: true
      };
      
      // Type assertion to avoid TypeScript errors with Supabase queries
      const { data, error } = await (supabase
        .from('services') as any)
        .insert(newService)
        .select();
      
      if (error) throw error;
      
      toast.success('Service added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      await fetchServices();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentService) return;
    
    try {
      const updatedService: UpdatableService = { ...formData };
      const serviceId = currentService.id;
      
      // Type assertion to avoid TypeScript errors with Supabase queries
      const { error } = await (supabase
        .from('services') as any)
        .update(updatedService)
        .eq('id', serviceId);
      
      if (error) throw error;
      
      toast.success('Service updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      await fetchServices();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleDeactivateService = async () => {
    if (!currentService) return;
    
    try {
      const serviceId = currentService.id;
      
      // Type assertion to avoid TypeScript errors with Supabase queries
      const { error } = await (supabase
        .from('services') as any)
        .update({ active: false })
        .eq('id', serviceId);
      
      if (error) throw error;
      
      toast.success('Service deactivated successfully');
      setIsDeleteDialogOpen(false);
      await fetchServices();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const openEditDialog = (service: Service) => {
    setCurrentService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (service: Service) => {
    setCurrentService(service);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Manage Services</h1>
            <Button 
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              Add New Service
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card 
                  key={service.id} 
                  className={service.active ? 'border-green-200' : 'border-red-200 opacity-60'}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-bold text-lg">{service.name}</h3>
                      <div>
                        {service.active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Inactive</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mb-4">{service.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">£{service.price.toFixed(2)}</span>
                      <span>{service.duration} min</span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(service)}
                      >
                        Edit
                      </Button>
                      {service.active && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openDeleteDialog(service)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {services.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No services found. Add your first service!
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Add Service Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddService}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (£)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Service</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Service Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditService}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Price (£)</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Service</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Service Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Service</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to deactivate {currentService?.name}? It will no longer be available for bookings.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeactivateService}>
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </Layout>
  );
};

export default ManageServices;
