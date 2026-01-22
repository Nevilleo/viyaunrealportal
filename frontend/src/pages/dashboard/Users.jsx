import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { useAuth } from '../../App';
import { 
  Users, 
  Shield, 
  User,
  Search,
  MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Kon gebruikers niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`${API}/users/${userId}/role?role=${newRole}`, {}, { withCredentials: true });
      toast.success('Rol bijgewerkt');
      fetchUsers();
    } catch (error) {
      toast.error('Kon rol niet bijwerken');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels = {
    admin: 'Administrator',
    manager: 'Manager',
    veldwerker: 'Veldwerker'
  };

  const roleColors = {
    admin: 'bg-red-500/20 text-red-500',
    manager: 'bg-purple-500/20 text-purple-500',
    veldwerker: 'bg-blue-500/20 text-blue-500'
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <Users className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 grid-bg min-h-screen" data-testid="users-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold tracking-tight uppercase mb-2">
          Gebruikers <span className="text-primary">Beheer</span>
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          {users.length} geregistreerde gebruikers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-xs font-mono text-muted-foreground">ADMINISTRATORS</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {users.filter(u => u.role === 'manager').length}
              </p>
              <p className="text-xs font-mono text-muted-foreground">MANAGERS</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 rounded-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {users.filter(u => u.role === 'veldwerker').length}
              </p>
              <p className="text-xs font-mono text-muted-foreground">VELDWERKERS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass p-4 rounded-sm mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoeken op naam of email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-950/50 border-white/10 rounded-sm"
            data-testid="search-users"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Gebruiker</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Email</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Rol</th>
                <th className="text-left p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Geregistreerd</th>
                <th className="text-right p-4 text-xs font-mono text-muted-foreground uppercase tracking-widest">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.user_id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  data-testid={`user-row-${user.user_id}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img 
                          src={user.picture} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{user.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-sm text-xs font-mono uppercase ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="p-4 text-right">
                    {user.user_id !== currentUser?.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`user-actions-${user.user_id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-white/10">
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(user.user_id, 'admin')}
                            className="cursor-pointer"
                          >
                            <Shield className="w-4 h-4 mr-2 text-red-500" />
                            Maak Administrator
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(user.user_id, 'manager')}
                            className="cursor-pointer"
                          >
                            <Users className="w-4 h-4 mr-2 text-purple-500" />
                            Maak Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRoleChange(user.user_id, 'veldwerker')}
                            className="cursor-pointer"
                          >
                            <User className="w-4 h-4 mr-2 text-blue-500" />
                            Maak Veldwerker
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
