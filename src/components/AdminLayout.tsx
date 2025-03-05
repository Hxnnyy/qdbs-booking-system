
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
import { Link } from 'react-router-dom';
import { ChartBarIcon, UsersIcon, ScissorsIcon, CalendarIcon, HomeIcon, Settings2Icon, ShieldIcon, FileUpIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
                        <ChartBarIcon />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Bookings">
                      <Link to="/admin/bookings">
                        <CalendarIcon />
                        <span>Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Import Bookings">
                      <Link to="/admin/import-bookings">
                        <FileUpIcon />
                        <span>Import Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Barbers">
                      <Link to="/admin/barbers">
                        <UsersIcon />
                        <span>Barbers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Services">
                      <Link to="/admin/services">
                        <ScissorsIcon />
                        <span>Services</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Shop Setup">
                      <Link to="/admin/setup">
                        <Settings2Icon />
                        <span>Shop Setup</span>
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
                    <SidebarMenuButton asChild tooltip="Assign Admin">
                      <Link to="/admin/assign-admin">
                        <ShieldIcon />
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
