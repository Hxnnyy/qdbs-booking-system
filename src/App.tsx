
import React from 'react';
import {
  Routes,
  Route,
} from "react-router-dom";
import './App.css';
import { QueryProvider } from './context/QueryProvider';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import CalendarView from './pages/admin/CalendarView';
import ManageBookings from './pages/admin/ManageBookings';
import ManageBookingsWithQuery from './pages/admin/ManageBookingsWithQuery';
import BarberList from './pages/admin/ManageBarbers';
import ServiceList from './pages/admin/ManageServices';
import NotificationTemplates from './pages/admin/NotificationSettings';
import AssignAdmin from './pages/admin/AssignAdmin';

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<CalendarView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><ManageBookings /></AdminRoute>} />
          <Route path="/admin/bookings-query" element={<AdminRoute><ManageBookingsWithQuery /></AdminRoute>} />
          <Route path="/admin/barbers" element={<AdminRoute><BarberList /></AdminRoute>} />
          <Route path="/admin/services" element={<AdminRoute><ServiceList /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute superAdminOnly={true}><NotificationTemplates /></AdminRoute>} />
          <Route path="/admin/assign-admin" element={<AdminRoute superAdminOnly={true}><AssignAdmin /></AdminRoute>} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
