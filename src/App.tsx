
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
import ImportBookings from './pages/admin/ImportBookings';
import CalendarView from './pages/admin/CalendarView';
import NotificationSettings from './pages/admin/NotificationSettings';
import ManageClients from './pages/admin/ManageClients';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
              <Route path="/admin/bookings" element={<AdminRoute><ManageBookings /></AdminRoute>} />
              <Route path="/admin/calendar" element={<AdminRoute><CalendarView /></AdminRoute>} />
              <Route path="/admin/barbers" element={<AdminRoute><ManageBarbers /></AdminRoute>} />
              <Route path="/admin/services" element={<AdminRoute><ManageServices /></AdminRoute>} />
              <Route path="/admin/clients" element={<AdminRoute><ManageClients /></AdminRoute>} />
              <Route path="/admin/import-bookings" element={<AdminRoute><ImportBookings /></AdminRoute>} />
              <Route path="/admin/assign-admin" element={<AdminRoute><AssignAdmin /></AdminRoute>} />
              <Route path="/admin/notifications" element={<AdminRoute><NotificationSettings /></AdminRoute>} />
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/barbers" element={<Barbers />} />
              <Route path="/services" element={<Services />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/book" 
                element={
                  <ProtectedRoute>
                    <Book />
                  </ProtectedRoute>
                } 
              />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
