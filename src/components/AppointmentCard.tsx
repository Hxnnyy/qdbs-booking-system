
import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  CalendarClock,
  MapPin,
  Scissors,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar
} from 'lucide-react';

export interface Appointment {
  id: string;
  barberId: number;
  barberName: string;
  barberImage: string;
  service: string;
  dateTime: Date;
  duration: number; // in minutes
  location?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price?: number;
}

interface AppointmentCardProps {
  appointment: Appointment;
  index: number;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  index, 
  onReschedule, 
  onCancel 
}) => {
  // Status badge
  const renderStatusBadge = () => {
    switch (appointment.status) {
      case 'upcoming':
        return (
          <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            <CalendarClock className="h-3 w-3" />
            <span>Upcoming</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass rounded-lg shadow-subtle border border-border overflow-hidden transition-all duration-300 hover:shadow-elevated"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              <img
                src={appointment.barberImage}
                alt={appointment.barberName}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1">{appointment.service}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <User className="h-4 w-4" />
                <span>{appointment.barberName}</span>
              </div>
            </div>
          </div>
          
          {renderStatusBadge()}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {format(appointment.dateTime, 'MMM d, yyyy')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {format(appointment.dateTime, 'h:mm a')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {appointment.duration} min
            </div>
          </div>
          {appointment.price && (
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">
                ${appointment.price.toFixed(2)}
              </div>
            </div>
          )}
          {appointment.location && (
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                {appointment.location}
              </div>
            </div>
          )}
        </div>
        
        {appointment.status === 'upcoming' && (
          <div className="flex gap-3 mt-5">
            {onReschedule && (
              <Button 
                onClick={() => onReschedule(appointment.id)} 
                variant="outline"
                size="sm"
                className="flex-1 rounded-full"
              >
                Reschedule
              </Button>
            )}
            {onCancel && (
              <Button 
                onClick={() => onCancel(appointment.id)} 
                variant="ghost"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive rounded-full"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AppointmentCard;
