import React, { useState, useEffect } from 'react';
import { StoreTeam } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreVertical, 
  Shield, 
  Edit, 
  Trash2, 
  Crown,
  Eye,
  Plus,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  editor: 'bg-green-100 text-green-800 border-green-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200'
};

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  viewer: Eye
};

const DEFAULT_PERMISSIONS = {
  owner: {
    canManageProducts: true,
    canManageOrders: true,
    canManageCategories: true,
    canViewReports: true,
    canManageContent: true,
    canManageTeam: true,
    canManageStore: true,
    canDeleteStore: true
  },
  admin: {
    canManageProducts: true,
    canManageOrders: true,
    canManageCategories: true,
    canViewReports: true,
    canManageContent: true,
    canManageTeam: true,
    canManageStore: false,
    canDeleteStore: false
  },
  editor: {
    canManageProducts: true,
    canManageOrders: true,
    canManageCategories: true,
    canViewReports: true,
    canManageContent: true,
    canManageTeam: false,
    canManageStore: false,
    canDeleteStore: false
  },
  viewer: {
    canManageProducts: false,
    canManageOrders: false,
    canManageCategories: false,
    canViewReports: true,
    canManageContent: false,
    canManageTeam: false,
    canManageStore: false,
    canDeleteStore: false
  }
};

export default function TeamManagement({ storeId, storeName }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'editor',
    message: '',
    permissions: DEFAULT_PERMISSIONS.editor
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    role: '',
    permissions: {}
  });

  useEffect(() => {
    if (storeId) {
      loadTeamMembers();
    }
  }, [storeId]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await StoreTeam.getTeamMembers(storeId);
      
      // Handle response structure: API returns direct array or nested structure
      let teamMembers = [];
      if (Array.isArray(response)) {
        // Direct array response
        teamMembers = response;
      } else if (response?.data?.team_members) {
        // Nested structure: response.data.team_members
        teamMembers = response.data.team_members;
      } else if (response?.team_members) {
        // Alternative nested: response.team_members
        teamMembers = response.team_members;
      }
      
      setTeamMembers(teamMembers);
    } catch (error) {
      console.error('❌ TeamManagement: Error loading team members:', error);
      console.error('❌ TeamManagement: Error details:', error.message);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    try {
      await StoreTeam.inviteMember(storeId, inviteForm);
      toast.success(`Invitation sent to ${inviteForm.email}`);
      setInviteDialogOpen(false);
      setInviteForm({
        email: '',
        role: 'editor',
        message: '',
        permissions: DEFAULT_PERMISSIONS.editor
      });
      loadTeamMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleUpdateMember = async () => {
    try {
      await StoreTeam.updateMember(storeId, selectedMember.id, editForm);
      toast.success('Team member updated successfully');
      setEditDialogOpen(false);
      setSelectedMember(null);
      loadTeamMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update team member');
    }
  };

  const handleRemoveMember = async (memberId, email) => {
    if (confirm(`Are you sure you want to remove ${email} from the team?`)) {
      try {
        await StoreTeam.removeMember(storeId, memberId);
        toast.success('Team member removed successfully');
        loadTeamMembers();
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove team member');
      }
    }
  };

  const openEditDialog = (member) => {
    setSelectedMember(member);
    setEditForm({
      role: member.role,
      permissions: member.permissions || DEFAULT_PERMISSIONS[member.role]
    });
    setEditDialogOpen(true);
  };

  const updateInvitePermissions = (role) => {
    setInviteForm(prev => ({
      ...prev,
      role,
      permissions: DEFAULT_PERMISSIONS[role]
    }));
  };

  const updatePermission = (permissionKey, value, isInvite = false) => {
    if (isInvite) {
      setInviteForm(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionKey]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionKey]: value
        }
      }));
    }
  };

  if (!storeId) {
    return (
      <Card className="material-elevation-1 border-0">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please select a store to manage team members</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="material-elevation-1 border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage team members and their permissions for this store
            </CardDescription>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Invite Team Member{storeName ? ` to ${storeName}` : ''}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="team@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={inviteForm.role} 
                      onValueChange={updateInvitePermissions}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {Object.entries(inviteForm.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-sm font-normal">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => updatePermission(key, checked, true)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Welcome Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Welcome to the team! You now have access to our store."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember} disabled={!inviteForm.email}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No team members yet</p>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite your first team member
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role] || Shield;
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.User?.email?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.User?.email}</div>
                          <div className="text-sm text-gray-500">
                            {member.User?.first_name && member.User?.last_name 
                              ? `${member.User.first_name} ${member.User.last_name}`
                              : 'No name provided'
                            }
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[member.role]}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt || member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id, member.User?.email)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Edit Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      {selectedMember.User?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedMember.User?.email}</div>
                    <div className="text-sm text-gray-500">
                      Current role: {selectedMember.role}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select 
                    value={editForm.role} 
                    onValueChange={(role) => setEditForm(prev => ({ 
                      ...prev, 
                      role, 
                      permissions: DEFAULT_PERMISSIONS[role] 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {Object.entries(editForm.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-sm font-normal">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Label>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => updatePermission(key, checked, false)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateMember}>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Member
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}