
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUpRight, TrendingUp, Users, Scissors, Calendar, DollarSign } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: 'users' | 'services' | 'bookings' | 'revenue';
  change?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value,
  icon,
  change 
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return <Users className="h-5 w-5 text-muted-foreground" />;
      case 'services':
        return <Scissors className="h-5 w-5 text-muted-foreground" />;
      case 'bookings':
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      case 'revenue':
        return <DollarSign className="h-5 w-5 text-muted-foreground" />;
      default:
        return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="rounded-full p-1.5 bg-muted/50">
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              change >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {change >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : null}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
