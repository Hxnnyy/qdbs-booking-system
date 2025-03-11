
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export const statusOptions = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' }
];

interface BookingFilterControlsProps {
  statusFilter: string | null;
  setStatusFilter: (value: string) => void;
  typeFilter: string | null;
  setTypeFilter: (value: string) => void;
  currentTab: string;
  setCurrentTab: (value: string) => void;
}

export const BookingFilterControls: React.FC<BookingFilterControlsProps> = ({
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  currentTab,
  setCurrentTab
}) => {
  return (
    <>
      <TabsList className="grid grid-cols-5 mb-4">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
      </TabsList>
      
      <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
        <Select onValueChange={setTypeFilter} value={typeFilter || undefined}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All booking types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="guest">Guest Bookings</SelectItem>
            <SelectItem value="user">User Bookings</SelectItem>
          </SelectContent>
        </Select>
        
        <Select onValueChange={setStatusFilter} value={statusFilter || undefined}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
