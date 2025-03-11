
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Barber, InsertableBarber, UpdatableBarber } from '@/supabase-types';
import { useBarbers } from './useBarbers';

export const useBarberManagement = () => {
  const { barbers, isLoading, error, refreshBarbers, reactivateBarber, deleteBarber } = useBarbers();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isServicesDialogOpen, setIsServicesDialogOpen] = useState(false);
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false);
  const [isLunchDialogOpen, setIsLunchDialogOpen] = useState(false);
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  
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
      color: barber.color || '#3B82F6'
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
  
  const openHolidayDialog = (barber: Barber) => {
    setCurrentBarber(barber);
    setIsHolidayDialogOpen(true);
  };
  
  return {
    barbers,
    isLoading,
    error,
    formData,
    currentBarber,
    isAddDialogOpen,
    isEditDialogOpen,
    isDeactivateDialogOpen,
    isDeleteDialogOpen,
    isServicesDialogOpen,
    isHoursDialogOpen,
    isLunchDialogOpen,
    isColorDialogOpen,
    isHolidayDialogOpen,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeactivateDialogOpen,
    setIsDeleteDialogOpen,
    setIsServicesDialogOpen,
    setIsHoursDialogOpen,
    setIsLunchDialogOpen,
    setIsColorDialogOpen,
    setIsHolidayDialogOpen,
    handleInputChange,
    resetForm,
    handleAddBarber,
    handleEditBarber,
    handleUpdateBarberColor,
    handleDeactivateBarber,
    handleReactivateBarber,
    handleDeleteBarber,
    openEditDialog,
    openColorDialog,
    openDeactivateDialog,
    openDeleteDialog,
    openServicesDialog,
    openHoursDialog,
    openLunchDialog,
    openHolidayDialog
  };
};
