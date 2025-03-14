
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global default settings
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      // Default error handling
      onError: (error: any) => {
        const message = error.message || 'An error occurred';
        const customMessage = error.meta?.errorMessage;
        toast.error(customMessage || message);
      }
    },
    mutations: {
      // Default error handling
      onError: (error: any) => {
        const message = error.message || 'An error occurred';
        toast.error(message);
      }
    }
  }
});

/**
 * QueryProvider Component
 * 
 * Wraps the application with React Query's QueryClientProvider
 */
export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
