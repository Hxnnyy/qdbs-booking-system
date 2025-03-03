import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { PlusCircle, Pencil, Trash, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBarbers, Barber } from '@/hooks/useBarbers';
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

const ManageBarbers = () => {
  const { barbers, refreshBarbers, isLoading } = useBarbers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openNewBarberDialog, setOpenNewBarberDialog] = useState(false);
  const [openEditBarberDialog, setOpenEditBarberDialog] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleOpenEditDialog = (barber: Barber) => {
    setSelectedBarber(barber);
    setName(barber.name);
    setSpecialty(barber.specialty);
    setBio(barber.bio || '');
    setImageUrl(barber.image_url || '');
    setOpenEditBarberDialog(true);
  };

  const resetForm = () => {
    setName('');
    setSpecialty('');
    setBio('');
    setImageUrl('');
    setSelectedBarber(null);
  };

  const handleCreateBarber = async () => {
    if (!name || !specialty) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('barbers')
        .insert({
          name,
          specialty,
          bio,
          image_url: imageUrl || 'https://source.unsplash.com/random/300x300/?barber',
          active: true
        } as any) as unknown as { error: any };

      if (error) throw error;

      toast.success('Barber created successfully');
      refreshBarbers();
      setOpenNewBarberDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBarber = async () => {
    if (!selectedBarber || !name || !specialty) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('barbers')
        .update({
          name,
          specialty,
          bio,
          image_url: imageUrl || selectedBarber.image_url
        } as any)
        .eq('id', selectedBarber.id) as unknown as { error: any };

      if (error) throw error;

      toast.success('Barber updated successfully');
      refreshBarbers();
      setOpenEditBarberDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateBarber = async (barberId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('barbers')
        .update({ active: false } as any)
        .eq('id', barberId) as unknown as { error: any };

      if (error) throw error;

      toast.success('Barber deactivated successfully');
      refreshBarbers();
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
            <h1 className="text-3xl font-bold mb-2 font-playfair">Manage Barbers</h1>
            <p className="text-muted-foreground font-playfair">
              Add, edit, or remove barbers from your team
            </p>
          </div>
          
          <Dialog open={openNewBarberDialog} onOpenChange={setOpenNewBarberDialog}>
            <DialogTrigger asChild>
              <Button className="bg-burgundy hover:bg-burgundy-light">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Barber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Barber</DialogTitle>
                <DialogDescription>
                  Create a new barber profile for your team
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Input 
                    id="specialty" 
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Classic Cuts & Styling"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe the barber's experience and skills..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input 
                    id="imageUrl" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use a default placeholder image
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setOpenNewBarberDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBarber}
                  disabled={isSubmitting}
                  className="bg-burgundy hover:bg-burgundy-light"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Creating...
                    </>
                  ) : (
                    'Create Barber'
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
        ) : barbers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <Card key={barber.id}>
                <CardHeader className="pb-4">
                  <CardTitle>{barber.name}</CardTitle>
                  <CardDescription>{barber.specialty}</CardDescription>
                </CardHeader>
                <CardContent>
                  {barber.bio && <p className="text-sm text-muted-foreground mb-4">{barber.bio}</p>}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenEditDialog(barber)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <UserX className="h-4 w-4 mr-1" /> Deactivate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate barber?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the barber from the active list. They will no longer be available for bookings.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeactivateBarber(barber.id)}
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
            <p className="text-muted-foreground mb-4">No barbers found</p>
            <Button 
              onClick={() => setOpenNewBarberDialog(true)}
              className="bg-burgundy hover:bg-burgundy-light"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Barber
            </Button>
          </div>
        )}
      </div>
      
      <Dialog open={openEditBarberDialog} onOpenChange={setOpenEditBarberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Barber</DialogTitle>
            <DialogDescription>
              Update this barber's information
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
              <Label htmlFor="edit-specialty">Specialty *</Label>
              <Input 
                id="edit-specialty" 
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea 
                id="edit-bio" 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input 
                id="edit-imageUrl" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenEditBarberDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateBarber}
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

export default ManageBarbers;
