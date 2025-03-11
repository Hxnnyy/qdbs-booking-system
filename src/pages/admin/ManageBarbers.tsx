
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Barber, InsertableBarber, UpdatableBarber } from '@/supabase-types';
import { OpeningHoursForm } from '@/components/admin/OpeningHoursForm';
import { BarberServicesForm } from '@/components/admin/BarberServicesForm';
import { LunchBreakForm } from '@/components/admin/LunchBreakForm';
import { useBarbers } from '@/hooks/useBarbers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ManageBarbers = () => {
  const { barbers, isLoading, error, refreshBarbers, reactivateBarber, deleteBarber } = useBarbers();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false);
  const [isLunchDialogOpen, setIsLunchDialogOpen] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  
  const [currentBarber, setCurrentBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    bio: '',
    image_url: '',
    color: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      bio: '',
      image_url: '',
      color: ''
    });
  };
  
  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newBarber: InsertableBarber = {
        ...formData,
        active: true
      };
      
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('barbers')
        .insert(newBarber)
        .select();
      
      if (error) throw error;
      
      toast.success('Barber added successfully');
      setIsAddDialogOpen(false);
      resetForm();
      await refreshBarbers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleEditBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentBarber) return;
    
    try {
      const updatedBarber: UpdatableBarber = { ...formData };
      const barberId = currentBarber.id;
      
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('barbers')
        .update(updatedBarber)
        .eq('id', barberId);
      
      if (error) throw error;
      
      toast.success('Barber updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      await refreshBarbers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateBarberColor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentBarber) return;
    
    try {
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('barbers')
        .update({ color: formData.color })
        .eq('id', currentBarber.id);
      
      if (error) throw error;
      
      toast.success('Barber color updated successfully');
      setIsColorDialogOpen(false);
      await refreshBarbers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleDeactivateBarber = async () => {
    if (!currentBarber) return;
    
    try {
      const barberId = currentBarber.id;
      
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('barbers')
        .update({ active: false })
        .eq('id', barberId);
      
      if (error) throw error;
      
      toast.success('Barber deactivated successfully');
      setIsDeactivateDialogOpen(false);
      await refreshBarbers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleReactivateBarber = async () => {
    if (!currentBarber) return;
    
    try {
      const success = await reactivateBarber(currentBarber.id);
      
      if (success) {
        toast.success('Barber reactivated successfully');
      } else {
        toast.error('Failed to reactivate barber');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteBarber = async () => {
    if (!currentBarber) return;
    
    try {
      const success = await deleteBarber(currentBarber.id);
      
      if (success) {
        toast.success('Barber deleted successfully');
        setIsDeleteDialogOpen(false);
      } else {
        toast.error('Failed to delete barber');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const openEditDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setFormData({
      name: barber.name || '',
      specialty: barber.specialty || '',
      bio: barber.bio || '',
      image_url: barber.image_url || '',
      color: barber.color || ''
    });
    setIsEditDialogOpen(true);
  };
  
  const openColorDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setFormData(prev => ({
      ...prev,
      color: barber.color || '#3B82F6' // Default to a blue color if none set
    }));
    setIsColorDialogOpen(true);
  };
  
  const openDeactivateDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsDeactivateDialogOpen(true);
  };

  const openDeleteDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsDeleteDialogOpen(true);
  };

  const openServicesDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsServicesDialogOpen(true);
  };

  const openHoursDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsHoursDialogOpen(true);
  };
  
  const openLunchDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsLunchDialogOpen(true);
  };
  
  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Manage Barbers</h1>
            <Button 
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              Add New Barber
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
              {barbers.map((barber) => (
                <Card 
                  key={barber.id} 
                  className={barber.active ? 'border-green-200' : 'border-red-200 opacity-60'}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{barber.name}</h3>
                        <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                      </div>
                      <div className="flex items-start">
                        {barber.active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Inactive</span>
                        )}
                      </div>
                    </div>
                    
                    {barber.bio && (
                      <p className="text-sm mb-4 line-clamp-3">{barber.bio}</p>
                    )}
                    
                    {barber.color && (
                      <div className="mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: barber.color }}></div>
                        <span className="text-sm text-muted-foreground">Calendar Color</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(barber)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openServicesDialog(barber)}
                      >
                        Services
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openHoursDialog(barber)}
                      >
                        Hours
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openLunchDialog(barber)}
                      >
                        Lunch
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openColorDialog(barber)}
                      >
                        Color
                      </Button>
                      
                      {barber.active ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openDeactivateDialog(barber)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => {
                            setCurrentBarber(barber);
                            handleReactivateBarber();
                          }}
                        >
                          Reactivate
                        </Button>
                      )}
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => openDeleteDialog(barber)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {barbers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No barbers found. Add your first barber!
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Add Barber Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Barber</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBarber}>
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
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Calendar Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      value={formData.color || '#3B82F6'}
                      onChange={handleInputChange}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      name="color"
                      value={formData.color || '#3B82F6'}
                      onChange={handleInputChange}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Barber</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Barber Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Barber</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditBarber}>
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
                  <Label htmlFor="edit-specialty">Specialty</Label>
                  <Input
                    id="edit-specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-image_url">Image URL</Label>
                  <Input
                    id="edit-image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-color">Calendar Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-color"
                      name="color"
                      type="color"
                      value={formData.color || '#3B82F6'}
                      onChange={handleInputChange}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      name="color"
                      value={formData.color || '#3B82F6'}
                      onChange={handleInputChange}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Barber</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Barber Color Dialog */}
        <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Set {currentBarber?.name}'s Calendar Color</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateBarberColor}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="barber-color">Select Color</Label>
                  <div className="flex gap-2 items-center mt-2">
                    <Input
                      id="barber-color"
                      name="color"
                      type="color"
                      value={formData.color || '#3B82F6'}
                      onChange={handleInputChange}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      name="color"
                      value={formData.color || '#3B82F6'}
                      onChange={handleInputChange}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <p className="text-sm mb-2">Preview:</p>
                  <div 
                    className="h-12 rounded-md flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: formData.color || '#3B82F6' }}
                  >
                    {currentBarber?.name}'s Appointments
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Color</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Deactivate Barber Dialog */}
        <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Barber</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to deactivate {currentBarber?.name}? They will no longer be available for bookings.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeactivateDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeactivateBarber}>
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Barber Alert Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Barber</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete {currentBarber?.name} and ALL their appointments.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBarber} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Services Dialog */}
        <Dialog open={isServicesDialogOpen} onOpenChange={setIsServicesDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage {currentBarber?.name}'s Services</DialogTitle>
            </DialogHeader>
            {currentBarber && (
              <BarberServicesForm 
                barberId={currentBarber.id} 
                onSaved={() => setIsServicesDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Hours Dialog */}
        <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage {currentBarber?.name}'s Hours</DialogTitle>
            </DialogHeader>
            {currentBarber && (
              <OpeningHoursForm 
                barberId={currentBarber.id} 
                onSaved={() => setIsHoursDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Lunch Break Dialog */}
        <Dialog open={isLunchDialogOpen} onOpenChange={setIsLunchDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage {currentBarber?.name}'s Lunch Break</DialogTitle>
            </DialogHeader>
            {currentBarber && (
              <LunchBreakForm 
                barberId={currentBarber.id} 
                onSaved={() => setIsLunchDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </Layout>
  );
};

export default ManageBarbers;
