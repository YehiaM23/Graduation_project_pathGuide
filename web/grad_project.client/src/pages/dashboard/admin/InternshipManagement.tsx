import { useState, useEffect, useCallback } from 'react';
import { adminApi, type AdminInternshipListItem, type PaginatedResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Trash2, MapPin, Users } from 'lucide-react';

export default function InternshipManagement() {
  const [data, setData] = useState<PaginatedResponse<AdminInternshipListItem> | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchInternships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getInternships({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: 15,
      });
      setData(res.data);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this internship?`)) return;

    try {
      await adminApi.toggleInternshipActive(id);
      fetchInternships();
    } catch (error) {
      console.error('Error toggling internship status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this internship? This will also delete all associated applications.')) return;

    try {
      await adminApi.deleteInternship(id);
      fetchInternships();
    } catch (error) {
      console.error('Error deleting internship:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Briefcase className="h-8 w-8" />
          Internship Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage all internship listings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'inactive'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === '' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
            </Button>
          ))}
        </div>
      </div>

      {data && (
        <p className="text-sm text-muted-foreground">
          Showing {data.items.length} of {data.totalCount} internships
        </p>
      )}

      {/* Internship List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading internships...</div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No internships found</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((internship) => (
            <Card key={internship.internshipId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{internship.title}</p>
                      <Badge
                        className={`text-xs shrink-0 ${internship.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {internship.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{internship.companyName}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {internship.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {internship.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {internship.applicationsCount} applications
                      </span>
                      {internship.stipend != null && (
                        <span>${internship.stipend}</span>
                      )}
                      {internship.deadline && (
                        <span>Deadline: {formatDate(internship.deadline)}</span>
                      )}
                      {internship.createdAt && (
                        <span>Created: {formatDate(internship.createdAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(internship.internshipId, internship.isActive)}
                      className={internship.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                    >
                      {internship.isActive ? (
                        <><ToggleRight className="h-4 w-4 mr-1" /> Deactivate</>
                      ) : (
                        <><ToggleLeft className="h-4 w-4 mr-1" /> Activate</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(internship.internshipId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
