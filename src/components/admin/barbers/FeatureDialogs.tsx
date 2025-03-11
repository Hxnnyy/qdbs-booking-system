
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarberServicesForm } from '@/components/admin/BarberServicesForm';
import { OpeningHoursForm } from '@/components/admin/OpeningHoursForm';
import { LunchBreakForm } from '@/components/admin/LunchBreakForm';
import { HolidayForm } from '@/components/admin/HolidayForm';
import { Barber } from '@/supabase-types';

interface FeatureDialogsProps {
  currentBarber: Barber | null;
  isServicesDialogOpen: boolean;
  setIsServicesDialogOpen: (open: boolean) => void;
  isHoursDialogOpen: boolean;
  setIsHoursDialogOpen: (open: boolean) => void;
  isLunchDialogOpen: boolean;
  setIsLunchDialogOpen: (open: boolean) => void;
  isHolidayDialogOpen: boolean;
  setIsHolidayDialogOpen: (open: boolean) => void;
}

export const FeatureDialogs: React.FC<FeatureDialogsProps> = ({
  currentBarber,
  isServicesDialogOpen,
  setIsServicesDialogOpen,
  isHoursDialogOpen,
  setIsHoursDialogOpen,
  isLunchDialogOpen,
  setIsLunchDialogOpen,
  isHolidayDialogOpen,
  setIsHolidayDialogOpen,
}) => {
  return (
    <>
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
      
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage {currentBarber?.name}'s Holidays</DialogTitle>
          </DialogHeader>
          {currentBarber && (
            <HolidayForm 
              barberId={currentBarber.id} 
              onSaved={() => setIsHolidayDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
