'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  Mail,
  Phone,
  Eye,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  Package,
  MapPin,
  Calendar,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { formatUserDisplayName, getUserRoleDisplayName, getUserStatusDisplay } from '@/lib/user-utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UsersService, type User } from '@/lib/users-service';
import Navigation from '@/components/Navigation';
import CollectionModal from '@/components/CollectionModal';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Collection modal state
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role_id === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await UsersService.getAllUsers();

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roleId: string) => {
    const roleDisplayName = getUserRoleDisplayName(roleId);
    const roleMap: { [key: string]: { color: string } } = {
      'member': { color: 'bg-green-100 text-green-800' },
      'collector': { color: 'bg-blue-100 text-blue-800' },
      'admin': { color: 'bg-red-100 text-red-800' },
      'super_admin': { color: 'bg-red-200 text-red-900' },
      'office_staff': { color: 'bg-purple-100 text-purple-800' }
    };

    const role = roleMap[roleId] || { color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={role.color}>
        {roleDisplayName}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; label: string } } = {
      'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'inactive': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      'suspended': { color: 'bg-yellow-100 text-yellow-800', label: 'Suspended' }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'collector':
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 'member':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'office_staff':
        return <UserX className="w-5 h-5 text-purple-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateCollection = (user: User) => {
    setSelectedUser(user);
    setIsCollectionModalOpen(true);
  };

  const handleCollectionSuccess = () => {
    // Refresh users data after successful collection
    loadUsers();
  };

  const handleCloseCollectionModal = () => {
    setIsCollectionModalOpen(false);
    setSelectedUser(null);
  };

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(users.map(user => user.role_id)));


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/W yellow.png" 
              alt="WozaMali Logo" 
              className="h-16 w-auto"
            />
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-2"></div>
            <p className="text-gray-300">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Users Management</h1>
            <p className="text-gray-400">Manage and view all users in the system</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadUsers}
              className="flex items-center space-x-2 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-orange-500" />
              <span className="text-sm font-medium text-gray-300">
                {filteredUsers.length} of {users.length} users
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Members</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.role_id === 'member').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Collectors</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.role_id === 'collector').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-orange-500" />
            <span className="text-white font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by first name, last name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-600">All roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role} className="text-white hover:bg-gray-600">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-600">All statuses</SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-gray-600">Active</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-gray-600">Inactive</SelectItem>
                  <SelectItem value="suspended" className="text-white hover:bg-gray-600">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-500" />
              <span className="text-white font-medium">All Users ({filteredUsers.length})</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              View and manage all users in the system
            </p>
          </div>
          <div className="p-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-gray-400">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No users have been created yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-300">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              {getRoleIcon(user.role_id)}
                            </div>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-orange-500" />
                                {formatUserDisplayName(user)}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(user.role_id)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {/* Collection button for resident-like users */}
                            {(['resident','member','customer'].includes(user.role_id)) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateCollection(user)}
                                className="flex items-center space-x-1 text-green-400 hover:text-green-300 hover:bg-green-900 border-green-600"
                              >
                                <Package className="h-4 w-4" />
                                <span>Collect</span>
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-700 border-gray-600">
                                <DropdownMenuItem className="text-white hover:bg-gray-600">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-gray-600">
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                {(['resident','member','customer'].includes(user.role_id)) && (
                                  <DropdownMenuItem onClick={() => handleCreateCollection(user)} className="text-white hover:bg-gray-600">
                                    <Package className="h-4 w-4 mr-2" />
                                    Create Collection
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={handleCloseCollectionModal}
        user={selectedUser}
        onSuccess={handleCollectionSuccess}
      />
      
      {/* Navigation */}
      <Navigation />
    </div>
  );
}
