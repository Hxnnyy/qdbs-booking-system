import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { QueryProvider } from './context/QueryProvider';
import { CalendarView } from './components/calendar/CalendarView';
import { BarberList } from './components/admin/BarberList';
import { ServiceList } from './components/admin/ServiceList';
import AdminRoute from './components/AdminRoute';
import Dashboard from './pages/admin/Dashboard';
import ManageBookings from './pages/admin/ManageBookings';
import ManageBookingsWithQuery from './pages/admin/ManageBookingsWithQuery';
import { NotificationTemplates } from './components/admin/NotificationTemplates';

const router = createBrowserRouter([
  {
    path: "/",
    element: <CalendarView />,
  },
  {
    path: "/calendar",
    element: <CalendarView />,
  },
  
  // Admin routes
  {
    path: "/admin",
    element: <AdminRoute><Dashboard /></AdminRoute>,
  },
  {
    path: "/admin/bookings",
    element: <AdminRoute><ManageBookings /></AdminRoute>,
  },
  {
    path: "/admin/bookings-query",
    element: <AdminRoute><ManageBookingsWithQuery /></AdminRoute>,
  },
  {
    path: "/admin/barbers",
    element: <AdminRoute><BarberList /></AdminRoute>,
  },
  {
    path: "/admin/services",
    element: <AdminRoute><ServiceList /></AdminRoute>,
  },
  {
    path: "/admin/notifications",
    element: <AdminRoute superAdminOnly={true}><NotificationTemplates /></AdminRoute>,
  },
]);

function App() {
  return (
    <AuthProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </AuthProvider>
  );
}

export default App;
