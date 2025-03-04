
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Index';
import About from './pages/About';
import Services from './pages/Services';
import Barbers from './pages/Barbers';
import Book from './pages/Book';
import GuestBooking from './pages/GuestBooking';
import VerifyGuestBooking from './pages/guestBooking/VerifyGuestBooking';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import ManageBarbers from './pages/admin/ManageBarbers';
import ManageServices from './pages/admin/ManageServices';
import ManageBookings from './pages/admin/ManageBookings';
import SetupShop from './pages/admin/SetupShop';
import AssignAdmin from './pages/admin/AssignAdmin';
import MakeJosephAdmin from './pages/admin/MakeJosephAdmin';
import { AdminLayout } from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/barbers" element={<Barbers />} />
        <Route path="/book" element={<Book />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/guest-booking" element={<GuestBooking />} />
        <Route path="/verify-booking" element={<VerifyGuestBooking />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="manage-barbers" element={<ManageBarbers />} />
          <Route path="manage-services" element={<ManageServices />} />
          <Route path="manage-bookings" element={<ManageBookings />} />
          <Route path="setup-shop" element={<SetupShop />} />
          <Route path="assign-admin" element={<AssignAdmin />} />
          <Route path="make-joseph-admin" element={<MakeJosephAdmin />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
