
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useBarberManagement } from '@/hooks/useBarberManagement';
import { BarberCard } from '@/components/admin/barbers/BarberCard';
import { AddBarberDialog } from '@/components/admin/barbers/AddBarberDialog';
import { EditBarberDialog } from '@/components/admin/barbers/EditBarberDialog';
import { ColorDialog } from '@/components/admin/barbers/ColorDialog';
import { DeactivateDialog } from '@/components/admin/barbers/DeactivateDialog';
import { DeleteDialog } from '@/components/admin/barbers/DeleteDialog';
import { FeatureDialogs } from '@/components/admin/barbers/FeatureDialogs';

const ManageBarbers = () => {
  const {
    barbers,
    isLoading,
    error,
    formData,
    currentBarber,
    setCurrentBarber,
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
    handleImageUploaded,
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
  } = useBarberManagement();
  
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
                <BarberCard 
                  key={barber.id}
                  barber={barber}
                  onEdit={openEditDialog}
                  onServices={openServicesDialog}
                  onHours={openHoursDialog}
                  onLunch={openLunchDialog}
                  onColor={openColorDialog}
                  onHoliday={openHolidayDialog}
                  onDeactivate={openDeactivateDialog}
                  onReactivate={() => {
                    setCurrentBarber(barber);
                    handleReactivateBarber();
                  }}
                  onDelete={openDeleteDialog}
                />
              ))}
              
              {barbers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No barbers found. Add your first barber!
                </div>
              )}
            </div>
          )}
        </div>
        
        <AddBarberDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          formData={formData}
          onInputChange={handleInputChange}
          onImageUploaded={handleImageUploaded}
          onSubmit={handleAddBarber}
        />
        
        <EditBarberDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          formData={formData}
          barberId={currentBarber?.id || ''}
          onInputChange={handleInputChange}
          onImageUploaded={handleImageUploaded}
          onSubmit={handleEditBarber}
        />
        
        <ColorDialog
          isOpen={isColorDialogOpen}
          onOpenChange={setIsColorDialogOpen}
          currentBarber={currentBarber}
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleUpdateBarberColor}
        />
        
        <DeactivateDialog
          isOpen={isDeactivateDialogOpen}
          onOpenChange={setIsDeactivateDialogOpen}
          currentBarber={currentBarber}
          onDeactivate={handleDeactivateBarber}
        />
        
        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          currentBarber={currentBarber}
          onDelete={handleDeleteBarber}
        />
        
        <FeatureDialogs
          currentBarber={currentBarber}
          isServicesDialogOpen={isServicesDialogOpen}
          setIsServicesDialogOpen={setIsServicesDialogOpen}
          isHoursDialogOpen={isHoursDialogOpen}
          setIsHoursDialogOpen={setIsHoursDialogOpen}
          isLunchDialogOpen={isLunchDialogOpen}
          setIsLunchDialogOpen={setIsLunchDialogOpen}
          isHolidayDialogOpen={isHolidayDialogOpen}
          setIsHolidayDialogOpen={setIsHolidayDialogOpen}
        />
      </AdminLayout>
    </Layout>
  );
};

export default ManageBarbers;
