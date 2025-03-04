
import { useContext } from 'react';
import { useAuth as useAuthFromContext } from '@/context/AuthContext';

// Re-export the hook from the context file
export const useAuth = useAuthFromContext;
