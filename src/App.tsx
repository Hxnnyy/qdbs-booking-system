
import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements
} from "react-router-dom";
import './App.css';
import { QueryProvider } from './context/QueryProvider';
import CalendarView from './pages/admin/CalendarView';
import BarberList from './pages/admin/ManageBarbers';
import ServiceList from './pages/admin/ManageServices';
import AdminRoute from './components/AdminRoute';
import Dashboard from './pages/admin/Dashboard';
import ManageBookings from './pages/admin/ManageBookings';
import ManageBookingsWithQuery from './pages/admin/ManageBookingsWithQuery';
import NotificationTemplates from './pages/admin/NotificationSettings';

// We'll create the routes with createRoutesFromElements to make it easier to wrap with AuthProvider later
const routes = createRoutesFromElements(
  <>
    <Route path="/" element={<CalendarView />} />
    <Route path="/calendar" element={<CalendarView />} />
    
    {/* Admin routes */}
    <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
    <Route path="/admin/bookings" element={<AdminRoute><ManageBookings /></AdminRoute>} />
    <Route path="/admin/bookings-query" element={<AdminRoute><ManageBookingsWithQuery /></AdminRoute>} />
    <Route path="/admin/barbers" element={<AdminRoute><BarberList /></AdminRoute>} />
    <Route path="/admin/services" element={<AdminRoute><ServiceList /></AdminRoute>} />
    <Route path="/admin/notifications" element={<AdminRoute superAdminOnly={true}><NotificationTemplates /></AdminRoute>} />
  </>
);

// Create the router with routes
const router = createBrowserRouter(routes);

function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;
