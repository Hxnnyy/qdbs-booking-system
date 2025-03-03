
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { PlusCircle, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useServices, Service } from '@/hooks/useServices';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ManageServices = () => {
  const { services, refreshServices, isLoading } = useServices();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openNewServiceDialog, setOpenNewServiceDialog] = useState(false);
  const [openEditServiceDialog, setOpenEditServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const handleOpenEditDialog = (service: Service) => {
    setSelectedService(service);
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setOpenEditServiceDialog(true);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setSelectedService(null);
  };

  const handleCreateService = async () => {
    if (!name || !description || !price || !duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('services')
        .insert({
          name,
          description,
          price: parseFloat(price),
          duration: parseInt(duration, 10),
          active: true
        } as any) as unknown as { error: any };

      if (error) throw error;

      toast.success('Service created successfully');
      refreshServices();
      setOpenNewServiceDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService || !name || !description || !price || !duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('services')
        .update({
          name,
          description,
          price: parseFloat(price),
          duration: parseInt(duration, 10)
        } as any)
        .eq('id', selectedService.id) as unknown as { error: any };

      if (error) throw error;

      toast.success('Service updated successfully');
      refreshServices();
      setOpenEditServiceDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateService = async (serviceId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('services')
        .update({ active: false } as any)
        .eq('id', serviceId) as unknown as { error: any };

      if (error) throw error;

      toast.success('Service deactivated successfully');
      refreshServices();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 font-playfair">Manage Services</h1>
            <p className="text-muted-foreground font-playfair">
              Add, edit, or remove services from your offerings
            </p>
          </div>
          
          <Dialog open={openNewServiceDialog} onOpenChange={setOpenNewServiceDialog}>
            <DialogTrigger asChild>
              <Button className="bg-burgundy hover:bg-burgundy-light">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Create a new service for your barbershop
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Haircut"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea 
                    id="description" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A traditional barber cut with precision and attention to detail..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (£) *</Label>
                    <Input 
                      id="price" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="25.00"
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
                      placeholder="45"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setOpenNewServiceDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateService}
                  disabled={isSubmitting}
                  className="bg-burgundy hover:bg-burgundy-light"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Creating...
                    </>
                  ) : (
                    'Create Service'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {service.duration} min | £{service.price.toFixed(2)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenEditDialog(service)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash className="h-4 w-4 mr-1" /> Deactivate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate service?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the service from your offerings list. It will no longer be available for bookings.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeactivateService(service.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No services found</p>
            <Button 
              onClick={() => setOpenNewServiceDialog(true)}
              className="bg-burgundy hover:bg-burgundy-light"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Service
            </Button>
          </div>
        )}
      </div>
      
      {/* Edit Service Dialog */}
      <Dialog open={openEditServiceDialog} onOpenChange={setOpenEditServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update this service's information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input 
                id="edit-name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea 
                id="edit-description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (£) *</Label>
                <Input 
                  id="edit-price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (minutes) *</Label>
                <Input 
                  id="edit-duration" 
                  type="number"
                  min="5"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenEditServiceDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateService}
              disabled={isSubmitting}
              className="bg-burgundy hover:bg-burgundy-light"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ManageServices;
