
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon, Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Barber, Service } from '@/supabase-types';
import { useBookingImport } from '@/hooks/useBookingImport';

interface BatchEntryFormProps {
  barbers: Barber[];
  services: Service[];
}

interface BookingEntry {
  id: string;
  guestName: string;
  guestPhone: string;
  barberId: string;
  serviceId: string;
  date: Date | undefined;
  time: string;
  notes: string;
}

export const BatchEntryForm: React.FC<BatchEntryFormProps> = ({ barbers, services }) => {
  const { importBookings, isImporting } = useBookingImport();
  const [entries, setEntries] = useState<BookingEntry[]>([
    createEmptyEntry()
  ]);
  
  const lastRowRef = useRef<HTMLDivElement>(null);
  
  function createEmptyEntry(): BookingEntry {
    return {
      id: crypto.randomUUID(),
      guestName: '',
      guestPhone: '',
      barberId: '',
      serviceId: '',
      date: undefined,
      time: '',
      notes: ''
    };
  }
  
  const handleInputChange = (id: string, field: keyof BookingEntry, value: any) => {
    setEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };
  
  const addNewEntry = () => {
    setEntries(prev => [...prev, createEmptyEntry()]);
    setTimeout(() => {
      lastRowRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const removeEntry = (id: string) => {
    if (entries.length === 1) {
      setEntries([createEmptyEntry()]);
      return;
    }
    
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const handleSubmit = async () => {
    const validEntries = entries.filter(
      e => e.guestName && e.barberId && e.serviceId && e.date && e.time
    );
    
    if (validEntries.length === 0) {
      toast.error("Please fill in at least one complete booking entry");
      return;
    }
    
    try {
      console.log("Submitting entries:", validEntries);
      const result = await importBookings(validEntries);
      
      console.log("Import result:", result);
      
      // Reset form after successful import
      setEntries([createEmptyEntry()]);
      toast.success(`Successfully imported ${result.successCount} booking(s)`);
      
      if (result.failedCount > 0) {
        toast.error(`Failed to import ${result.failedCount} booking(s)`);
        console.error("Import errors:", result.errors);
      }
      
      // Refresh page to show updated bookings after a short delay
      setTimeout(() => {
        window.location.href = '/admin/calendar';
      }, 2000);
    } catch (error: any) {
      toast.error("Failed to import bookings: " + error.message);
      console.error("Import error:", error);
    }
  };
  
  const isFormValid = entries.some(
    e => e.guestName && e.barberId && e.serviceId && e.date && e.time
  );
  
  return (
    <div className="space-y-6">
      <div className="bg-secondary/30 p-4 rounded-lg mb-6 border border-border">
        <h3 className="font-medium mb-2">Quick Entry Tips:</h3>
        <ul className="text-sm space-y-1 list-disc pl-5">
          <li>Tab between fields for fast data entry</li>
          <li>Select a date once to apply to all new entries</li>
          <li>Required fields: Name, Barber, Service, Date, and Time</li>
          <li>Click "Add Row" or press Enter in the last field to add a new row</li>
        </ul>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
        {entries.map((entry, index) => (
          <Card key={entry.id} className="p-4 relative">
            <button 
              type="button" 
              onClick={() => removeEntry(entry.id)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
              aria-label="Remove entry"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Customer Info */}
              <div className="col-span-12 sm:col-span-5 space-y-4">
                <div>
                  <Label htmlFor={`name-${entry.id}`}>Customer Name</Label>
                  <Input
                    id={`name-${entry.id}`}
                    value={entry.guestName}
                    onChange={e => handleInputChange(entry.id, 'guestName', e.target.value)}
                    placeholder="Guest name"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`phone-${entry.id}`}>Phone Number</Label>
                  <Input
                    id={`phone-${entry.id}`}
                    value={entry.guestPhone}
                    onChange={e => handleInputChange(entry.id, 'guestPhone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
              
              {/* Service Details */}
              <div className="col-span-12 sm:col-span-7 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`barber-${entry.id}`}>Barber</Label>
                    <Select
                      value={entry.barberId}
                      onValueChange={value => handleInputChange(entry.id, 'barberId', value)}
                    >
                      <SelectTrigger id={`barber-${entry.id}`}>
                        <SelectValue placeholder="Select barber" />
                      </SelectTrigger>
                      <SelectContent>
                        {barbers.map(barber => (
                          <SelectItem key={barber.id} value={barber.id}>
                            {barber.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor={`service-${entry.id}`}>Service</Label>
                    <Select
                      value={entry.serviceId}
                      onValueChange={value => handleInputChange(entry.id, 'serviceId', value)}
                    >
                      <SelectTrigger id={`service-${entry.id}`}>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} (£{service.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`date-${entry.id}`}>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id={`date-${entry.id}`}
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !entry.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {entry.date ? format(entry.date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={entry.date}
                          onSelect={(date) => {
                            handleInputChange(entry.id, 'date', date);
                            // Auto-apply the same date to new entries
                            if (index === entries.length - 1 && date) {
                              setEntries(prev => prev.map((e, i) => 
                                i === index || !e.date ? { ...e, date } : e
                              ));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor={`time-${entry.id}`}>Time</Label>
                    <Select
                      value={entry.time}
                      onValueChange={value => handleInputChange(entry.id, 'time', value)}
                    >
                      <SelectTrigger id={`time-${entry.id}`}>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, hour) => {
                          const times = [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`];
                          return times.map(time => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ));
                        }).flat()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor={`notes-${entry.id}`}>Notes (Optional)</Label>
                  <Input
                    id={`notes-${entry.id}`}
                    value={entry.notes}
                    onChange={e => handleInputChange(entry.id, 'notes', e.target.value)}
                    placeholder="Any notes about this booking"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && index === entries.length - 1) {
                        e.preventDefault();
                        addNewEntry();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {index === entries.length - 1 && <div ref={lastRowRef} />}
          </Card>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={addNewEntry}
          className="sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
        
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={!isFormValid || isImporting}
          className="sm:w-auto"
        >
          {isImporting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Importing...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save {entries.filter(e => e.guestName && e.barberId && e.serviceId && e.date && e.time).length} Booking(s)
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
