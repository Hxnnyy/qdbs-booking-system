
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Barbers from "./pages/Barbers";
import Services from "./pages/Services";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Book from "./pages/Book";
import GuestBooking from "./pages/GuestBooking";
import VerifyGuestBooking from "./pages/VerifyGuestBooking";
import Profile from "./pages/Profile";
import Dashboard from "./pages/admin/Dashboard";
import ManageBarbers from "./pages/admin/ManageBarbers";
import ManageServices from "./pages/admin/ManageServices";
import ManageBookings from "./pages/admin/ManageBookings";
import AssignAdmin from "./pages/admin/AssignAdmin";
import SetupShop from './pages/admin/SetupShop';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/barbers" element={<Barbers />} />
            <Route path="/services" element={<Services />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/book" element={<Book />} />
            <Route path="/book-guest" element={<GuestBooking />} />
            <Route path="/verify-booking" element={<VerifyGuestBooking />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/barbers" 
              element={
                <AdminRoute>
                  <ManageBarbers />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/services" 
              element={
                <AdminRoute>
                  <ManageServices />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/bookings" 
              element={
                <AdminRoute>
                  <ManageBookings />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/assign-admin" 
              element={
                <AdminRoute>
                  <AssignAdmin />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/setup" 
              element={
                <AdminRoute>
                  <SetupShop />
                </AdminRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
