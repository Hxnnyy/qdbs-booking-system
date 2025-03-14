
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import AdminListItem from '@/components/admin/AdminListItem';
import { Profile } from '@/supabase-types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define explicit types for Supabase responses to avoid deep type instantiation
interface ProfileData {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
}

type ProfileQueryResponse = { 
  data: ProfileData[] | null; 
  error: Error | null 
};

type RPCResponse = {
  data: string | null;
  error: Error | null;
};

type MutationResponse = {
  error: Error | null;
};

const AdminManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [makeSuperAdmin, setMakeSuperAdmin] = useState(false);

  // Fetch all admins
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('is_admin.eq.true,is_super_admin.eq.true');
      
      if (error) throw error;

      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check if the user exists in profiles
      const profileQuery: ProfileQueryResponse = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);
      
      const { data: profileData, error: profileError } = profileQuery;
      
      if (profileError) {
        throw new Error('Error checking user profile');
      }
      
      // If profile exists, update it
      if (profileData && profileData.length > 0) {
        const profileId = profileData[0].id;
        
        const updateResult: MutationResponse = await supabase
          .from('profiles')
          .update({ 
            is_admin: true,
            is_super_admin: makeSuperAdmin 
          })
          .eq('id', profileId);
          
        if (updateResult.error) {
          throw new Error('Failed to update user profile');
        }
        
        toast.success(`${makeSuperAdmin ? 'Super Admin' : 'Admin'} privileges granted to ${email}`);
        setEmail('');
        setMakeSuperAdmin(false);
        fetchAdmins();
        return;
      }
      
      // If no profile, try to get user ID by email
      const rpcResult: RPCResponse = await supabase.rpc('get_user_id_by_email', {
        user_email: email
      });
      
      const { data: userId, error: userIdError } = rpcResult;
      
      if (userIdError || !userId) {
        throw new Error('User not found');
      }
      
      // Create a profile for the user
      const insertResult: MutationResponse = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          is_admin: true,
          is_super_admin: makeSuperAdmin
        });
        
      if (insertResult.error) {
        throw new Error('Failed to create user profile');
      }
      
      toast.success(`${makeSuperAdmin ? 'Super Admin' : 'Admin'} privileges granted to ${email}`);
      setEmail('');
      setMakeSuperAdmin(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error assigning admin:', error);
      toast.error(error instanceof Error ? error.message : 'Error assigning admin privileges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAdmin = async (admin: Profile) => {
    if (!admin.email) {
      toast.error('Admin email not found');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_admin: false,
          is_super_admin: false 
        })
        .eq('id', admin.id);
      
      if (error) throw error;
      
      toast.success(`Admin privileges revoked from ${admin.email}`);
      fetchAdmins();
    } catch (error) {
      console.error('Error revoking admin:', error);
      toast.error('Failed to revoke admin privileges');
    }
  };

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page. Only Super Admins can manage administrators.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">Admin Management</h1>
        
        <Tabs defaultValue="assign">
          <TabsList className="mb-6">
            <TabsTrigger value="assign">Assign Admin</TabsTrigger>
            <TabsTrigger value="manage">Manage Admins</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assign">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Grant Admin Privileges</CardTitle>
                <CardDescription>
                  Assign admin privileges to a user by email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAssignAdmin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">User Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter user email"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      id="superadmin"
                      type="checkbox"
                      checked={makeSuperAdmin}
                      onChange={() => setMakeSuperAdmin(!makeSuperAdmin)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="superadmin">Make Super Admin</Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" /> Assigning...
                      </>
                    ) : (
                      `Grant ${makeSuperAdmin ? 'Super Admin' : 'Admin'} Privileges`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage">
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>Manage Administrators</CardTitle>
                <CardDescription>
                  View and manage all administrators in the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAdmins ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : admins.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No administrators found.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {admins.map(admin => (
                      <AdminListItem
                        key={admin.id}
                        email={admin.email || ''}
                        firstName={admin.first_name}
                        lastName={admin.last_name}
                        isSuperAdmin={!!admin.is_super_admin}
                        onRevoke={() => handleRevokeAdmin(admin)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminManagement;
