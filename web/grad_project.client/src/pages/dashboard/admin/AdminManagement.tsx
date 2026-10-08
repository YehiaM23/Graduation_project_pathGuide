import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Plus, Trash2, Edit, Key, AlertCircle } from 'lucide-react';

interface AdminItem {
  adminProfileId: number;
  userId: number;
  email: string;
  name: string;
  isFullAdmin: boolean;
  isActive: boolean;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullAdmin, setIsFullAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', phone: '', isFullAdmin: false });
  const [createLoading, setCreateLoading] = useState(false);

  // Password change
  const [passwordAdminId, setPasswordAdminId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchAdmins();
    checkFullAdmin();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await adminApi.getAdmins();
      setAdmins(res.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFullAdmin = async () => {
    try {
      const res = await adminApi.isFullAdmin();
      setIsFullAdmin(res.data.isFullAdmin);
    } catch {
      setIsFullAdmin(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.createAdmin(createForm);
      setSuccess('Admin created successfully');
      setShowCreateForm(false);
      setCreateForm({ email: '', password: '', name: '', phone: '', isFullAdmin: false });
      fetchAdmins();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    setError('');
    setSuccess('');
    try {
      await adminApi.deleteAdmin(id);
      setSuccess('Admin deleted successfully');
      fetchAdmins();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to delete admin');
    }
  };

  const handleChangePassword = async (id: number) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await adminApi.changeAdminPassword(id, { newPassword });
      setSuccess('Password changed successfully');
      setPasswordAdminId(null);
      setNewPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to change password');
    }
  };

  const handleToggleActive = async (admin: AdminItem) => {
    setError('');
    setSuccess('');
    try {
      await adminApi.updateAdmin(admin.adminProfileId, { isActive: !admin.isActive });
      setSuccess(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to update admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Admin Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage administrator accounts</p>
        </div>
        {isFullAdmin && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Create Admin Form */}
      {showCreateForm && isFullAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFullAdmin"
                  checked={createForm.isFullAdmin}
                  onChange={(e) => setCreateForm({ ...createForm, isFullAdmin: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isFullAdmin">Full Admin (can manage other admins)</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Admin'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading admins...</div>
      ) : admins.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No admins found</div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <Card key={admin.adminProfileId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {admin.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{admin.name}</p>
                        {admin.isFullAdmin && (
                          <Badge className="text-xs bg-primary/10 text-primary">Full Admin</Badge>
                        )}
                        <Badge className={`text-xs ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  {isFullAdmin && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(admin)}>
                        <Edit className="h-4 w-4 mr-1" />
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setPasswordAdminId(admin.adminProfileId); setNewPassword(''); }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(admin.adminProfileId)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Password Change Inline */}
                {passwordAdminId === admin.adminProfileId && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2">
                    <Input
                      type="password"
                      placeholder="New password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button size="sm" onClick={() => handleChangePassword(admin.adminProfileId)}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => { setPasswordAdminId(null); setNewPassword(''); }}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
