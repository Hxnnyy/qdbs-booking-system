import React from 'react';
import { User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
interface AdminListItemProps {
  email: string;
  firstName?: string;
  lastName?: string;
  isSuperAdmin: boolean;
  onRevoke: () => void;
}
const AdminListItem: React.FC<AdminListItemProps> = ({
  email,
  firstName,
  lastName,
  isSuperAdmin,
  onRevoke
}) => {
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email;
  return <div className="flex items-center justify-between p-4 border rounded-md mb-2 bg-slate-800">
      <div className="flex items-center space-x-3">
        {isSuperAdmin ? <Shield className="h-6 w-6 text-red-500" /> : <User className="h-6 w-6 text-blue-500" />}
        <div>
          <div className="font-medium">{displayName}</div>
          <div className="text-sm text-gray-500">{email}</div>
        </div>
        <Badge variant={isSuperAdmin ? "destructive" : "default"} className="ml-2">
          {isSuperAdmin ? 'Super Admin' : 'Admin'}
        </Badge>
      </div>
      <Button variant="outline" size="sm" onClick={onRevoke} className="text-red-500 hover:text-red-700 hover:bg-red-50">
        Revoke
      </Button>
    </div>;
};
export default AdminListItem;