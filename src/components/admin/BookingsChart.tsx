
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BookingData {
  date: string;
  count: number;
  revenue: number;
}

interface BookingsChartProps {
  data: BookingData[];
}

export const BookingsChart: React.FC<BookingsChartProps> = ({ data }) => {
  const [view, setView] = useState<'bookings' | 'revenue'>('bookings');

  // Custom Tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          {view === 'bookings' && (
            <p className="text-sm text-muted-foreground">
              Bookings: <span className="font-medium text-primary">{payload[0].value}</span>
            </p>
          )}
          {view === 'revenue' && (
            <p className="text-sm text-muted-foreground">
              Revenue: <span className="font-medium text-primary">£{payload[0].value.toFixed(2)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Bookings Overview</CardTitle>
        <Tabs 
          defaultValue="bookings" 
          value={view} 
          onValueChange={(value) => setView(value as 'bookings' | 'revenue')}
          className="h-8"
        >
          <TabsList className="grid grid-cols-2 w-[200px]">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                {view === 'bookings' ? (
                  <Bar 
                    dataKey="count" 
                    name="Bookings" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                  />
                ) : (
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue (£)" 
                    fill="hsl(var(--accent))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-4 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p>No bookings data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
