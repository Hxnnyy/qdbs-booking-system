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
import { toast } from 'sonner';
import { Barber, InsertableBarber, UpdatableBarber } from '@/supabase-types';

const ManageBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [currentBarber, setCurrentBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    bio: '',
    image_url: ''
  });
  
  const fetchBarbers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .order('active', { ascending: false })
        .order('name');
      
      if (error) throw error;
      
      setBarbers(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBarbers();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      bio: '',
      image_url: ''
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
      await fetchBarbers();
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
      await fetchBarbers();
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
      setIsDeleteDialogOpen(false);
      await fetchBarbers();
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
      image_url: barber.image_url || ''
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsDeleteDialogOpen(true);
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
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(barber)}
                      >
                        Edit
                      </Button>
                      {barber.active && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openDeleteDialog(barber)}
                        >
                          Deactivate
                        </Button>
                      )}
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
              </div>
              <DialogFooter>
                <Button type="submit">Update Barber</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Barber Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Barber</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to deactivate {currentBarber?.name}? They will no longer be available for bookings.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeactivateBarber}>
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </Layout>
  );
};

export default ManageBarbers;
