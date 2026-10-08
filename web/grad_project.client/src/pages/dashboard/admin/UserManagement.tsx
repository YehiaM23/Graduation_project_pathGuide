import { useState, useEffect, useCallback } from 'react';
import { adminApi, type AdminUserListItem, type PaginatedResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

export default function UserManagement() {
  const [data, setData] = useState<PaginatedResponse<AdminUserListItem> | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 15,
      });
      setData(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await adminApi.toggleUserActive(userId);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage students and recruiters</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['', 'student', 'recruiter'].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter(role)}
            >
              {role === '' ? 'All' : role === 'student' ? 'Students' : 'Recruiters'}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {data && (
        <p className="text-sm text-muted-foreground">
          Showing {data.items.length} of {data.totalCount} users
        </p>
      )}

      {/* User List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading users...</div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No users found</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((user) => (
            <Card key={user.userId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {user.role}
                        </Badge>
                        <Badge
                          className={`text-xs shrink-0 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {!user.emailVerified && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 shrink-0">Unverified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {user.role === 'student' && user.universityName && (
                          <span>{user.universityName}</span>
                        )}
                        {user.role === 'student' && user.majorName && (
                          <span>{user.majorName}</span>
                        )}
                        {user.role === 'recruiter' && user.companyName && (
                          <span>{user.companyName}</span>
                        )}
                        {user.createdAt && (
                          <span>Joined {formatDate(user.createdAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user.userId, user.isActive)}
                    className={user.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                  >
                    {user.isActive ? (
                      <><ToggleRight className="h-4 w-4 mr-1" /> Deactivate</>
                    ) : (
                      <><ToggleLeft className="h-4 w-4 mr-1" /> Activate</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
