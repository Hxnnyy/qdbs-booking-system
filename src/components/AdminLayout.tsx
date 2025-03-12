
import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider
} from '@/components/ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { ChartBarIcon, UsersIcon, ScissorsIcon, CalendarIcon, HomeIcon, Settings2Icon, ShieldIcon, FileUpIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Helper function to determine if a route is active
  const isActive = (path: string) => {
    return currentPath.includes(path);
  };
  
  // Icon style based on active state
  const getIconStyle = (path: string) => {
    return isActive(path) ? "text-red-500" : "text-white";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="px-3 py-2">
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <Link to="/admin">
                        <ChartBarIcon className={getIconStyle('/admin')} />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Bookings">
                      <Link to="/admin/bookings">
                        <CalendarIcon className={getIconStyle('/admin/bookings')} />
                        <span>Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Calendar">
                      <Link to="/admin/calendar">
                        <CalendarIcon className={getIconStyle('/admin/calendar')} />
                        <span>Calendar</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Barbers">
                      <Link to="/admin/barbers">
                        <UsersIcon className={getIconStyle('/admin/barbers')} />
                        <span>Barbers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Services">
                      <Link to="/admin/services">
                        <ScissorsIcon className={getIconStyle('/admin/services')} />
                        <span>Services</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Shop Setup">
                      <Link to="/admin/setup">
                        <Settings2Icon className={getIconStyle('/admin/setup')} />
                        <span>Shop Setup</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Import Bookings">
                      <Link to="/admin/import-bookings">
                        <FileUpIcon className={getIconStyle('/admin/import-bookings')} />
                        <span>Import Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Assign Admin">
                      <Link to="/admin/assign-admin">
                        <ShieldIcon className={getIconStyle('/admin/assign-admin')} />
                        <span>Assign Admin</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-3">
              <SidebarMenuButton asChild tooltip="Back to Home">
                <Link to="/">
                  <HomeIcon />
                  <span>Back to Site</span>
                </Link>
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};
