
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
      // In v5, we use onError in meta instead of directly in options
      meta: {
        // Default error handling function that will be used by individual queries
        onError: (error: any) => {
          const message = error.message || 'An error occurred';
          toast.error(message);
        }
      }
    },
    mutations: {
      // For mutations, onError is still a top-level property
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
