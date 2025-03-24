
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface AdminRouteProps {
  children: React.ReactNode;
  superAdminOnly?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, superAdminOnly = false }) => {
  const { isAdmin, isSuperAdmin, isLoading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Log admin state for debugging
    console.log("Admin route - Auth state:", { user, isAdmin, isSuperAdmin, isLoading, superAdminOnly });
  }, [user, isAdmin, isSuperAdmin, isLoading, superAdminOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For super admin only routes
  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // For regular admin routes
  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
