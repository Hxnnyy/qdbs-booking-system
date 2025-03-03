
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
import { BarberType } from '@/types/supabase';

const ManageBarbers = () => {
  const [barbers, setBarbers] = useState<BarberType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBarber, setEditingBarber] = useState<BarberType | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('barbers' as any)
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setBarbers(data || []);
    } catch (error: any) {
      toast.error('Error fetching barbers: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSpecialty('');
    setBio('');
    setImageUrl('');
    setActive(true);
    setEditingBarber(null);
  };

  const handleEditBarber = (barber: BarberType) => {
    setEditingBarber(barber);
    setName(barber.name);
    setSpecialty(barber.specialty);
    setBio(barber.bio || '');
    setImageUrl(barber.image_url || '');
    setActive(barber.active);
    setShowForm(true);
  };

  const handleAddNewBarber = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !specialty) {
      toast.error('Name and specialty are required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const barberData = {
        name,
        specialty,
        bio,
        image_url: imageUrl,
        active
      };
      
      if (editingBarber) {
        // Update existing barber
        const { error } = await supabase
          .from('barbers' as any)
          .update(barberData as any)
          .eq('id', editingBarber.id);
        
        if (error) throw error;
        
        toast.success('Barber updated successfully');
      } else {
        // Create new barber
        const { error } = await supabase
          .from('barbers' as any)
          .insert(barberData as any);
        
        if (error) throw error;
        
        toast.success('Barber added successfully');
      }
      
      resetForm();
      setShowForm(false);
      fetchBarbers();
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
          <h1 className="text-3xl font-bold font-playfair">Manage Barbers</h1>
          <Button 
            onClick={handleAddNewBarber}
            className="bg-burgundy hover:bg-burgundy-light"
          >
            Add New Barber
          </Button>
        </div>
        
        {showForm && (
          <Card className="mb-8 glass shadow-subtle border border-border">
            <CardHeader>
              <CardTitle>{editingBarber ? 'Edit Barber' : 'Add New Barber'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Barber name"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty *</Label>
                    <Input 
                      id="specialty" 
                      value={specialty} 
                      onChange={(e) => setSpecialty(e.target.value)} 
                      placeholder="e.g. Classic Cuts, Beard Styling"
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="A brief description of the barber's experience and style"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input 
                    id="imageUrl" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    placeholder="URL to barber's image"
                  />
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
                      editingBarber ? 'Update Barber' : 'Add Barber'
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
        ) : barbers.length === 0 ? (
          <Card className="glass shadow-subtle border border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No barbers found</p>
              <Button 
                onClick={handleAddNewBarber}
                className="bg-burgundy hover:bg-burgundy-light"
              >
                Add Your First Barber
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {barbers.map((barber) => (
              <Card 
                key={barber.id} 
                className={`glass shadow-subtle border ${barber.active ? 'border-border' : 'border-red-200 bg-red-50/30'}`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-xl font-semibold flex items-center">
                        {barber.name}
                        {!barber.active && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Inactive
                          </span>
                        )}
                      </h2>
                      <p className="text-muted-foreground">{barber.specialty}</p>
                      {barber.bio && (
                        <p className="mt-2 text-sm">{barber.bio}</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => handleEditBarber(barber)}
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

export default ManageBarbers;
