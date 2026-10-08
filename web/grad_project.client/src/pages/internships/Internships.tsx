import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { internshipApi, applicationApi, type Internship } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Header } from '@/components/Header';
import { StudentLayout } from '@/components/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, Search, MapPin, Clock, AlertCircle, Calendar, CheckCircle, XCircle, Hourglass, Award } from 'lucide-react';

interface ApplicationStatus {
  status: string;
  applicationId: number;
}

export default function InternshipsPage() {
  const { user, isAuthenticated } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [filteredInternships, setFilteredInternships] = useState<Internship[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<Map<number, ApplicationStatus>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInternships();
    fetchStudentApplications();
  }, [isAuthenticated, user?.role]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await internshipApi.getAll(true);
      setInternships(response.data || []);
      setFilteredInternships(response.data || []);
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError('Failed to load internships. Please try again later.');
      setInternships([]);
      setFilteredInternships([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentApplications = async () => {
    if (isAuthenticated && user?.role === 'student') {
      try {
        const response = await applicationApi.getStudentApplications();
        const applications = response.data || [];
        const statusMap = new Map<number, ApplicationStatus>();
        applications.forEach((app: { internshipId: number; status: string; applicationId: number }) => {
          statusMap.set(app.internshipId, {
            status: app.status,
            applicationId: app.applicationId
          });
        });
        setApplicationStatuses(statusMap);
      } catch (err) {
        console.error('Error fetching student applications:', err);
      }
    }
  };

  useEffect(() => {
    let filtered = internships;

    if (searchQuery) {
      filtered = filtered.filter(
        (internship) =>
          internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          internship.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          internship.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          internship.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          internship.requiredSkill?.skillName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInternships(filtered);
  }, [searchQuery, internships]);

  const formatDuration = (weeks?: number) => {
    if (!weeks) return 'Not specified';
    if (weeks >= 4) {
      const months = Math.round(weeks / 4);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  };

  const isStudent = isAuthenticated && user?.role === 'student';

  const content = (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--primary)] via-[var(--accent)] to-[var(--secondary)] opacity-90" />
            <Briefcase className="relative h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Browse Internships
          </h1>
        </div>
        <p className="text-lg text-[var(--muted-foreground)]">
          Find internship opportunities that match your skills and career goals
        </p>
      </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Search internships by title, company, location, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && (
          <div className="mb-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Showing {filteredInternships.length} of {internships.length} internships
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-3/4 mb-2 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-[var(--muted)] rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 w-full mb-4 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInternships.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
              <h3 className="text-lg font-semibold mb-2">No internships found</h3>
              <p className="text-[var(--muted-foreground)] text-center mb-4">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredInternships.map((internship) => (
              <Card key={internship.internshipId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{internship.title}</CardTitle>
                      <CardDescription className="font-medium text-base">
                        {internship.companyName || 'Company'}
                      </CardDescription>
                    </div>
                    {internship.requiredSkill && (
                      <Badge variant="secondary">
                        {internship.requiredSkill.skillName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
                    {internship.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {internship.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                        <span>{internship.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <span>{formatDuration(internship.periodInWeeks)}</span>
                    </div>
                    {internship.stipend && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-[var(--primary)]">
                          {internship.stipend} EGP
                        </span>
                      </div>
                    )}
                    {internship.startDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Start Date</span>
                        <span className="font-medium">
                          {formatDate(internship.startDate)}
                        </span>
                      </div>
                    )}
                    {internship.deadline && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Deadline
                        </span>
                        <span className="font-medium">
                          {formatDate(internship.deadline)}
                        </span>
                      </div>
                    )}
                    {applicationStatuses.has(internship.internshipId) ? (
                      <div className="space-y-2">
                        {(() => {
                          const appStatus = applicationStatuses.get(internship.internshipId)!;
                          const status = appStatus.status.toLowerCase();

                          if (status === 'completed') {
                            return (
                              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-purple-50 border border-purple-200 rounded-md">
                                <Award className="h-5 w-5 text-purple-600" />
                                <span className="text-purple-700 font-medium">Completed</span>
                              </div>
                            );
                          } else if (status === 'accepted') {
                            return (
                              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 border border-green-200 rounded-md">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-green-700 font-medium">Accepted</span>
                              </div>
                            );
                          } else if (status === 'rejected' || status === 'refused') {
                            return (
                              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-red-50 border border-red-200 rounded-md">
                                <XCircle className="h-5 w-5 text-red-600" />
                                <span className="text-red-700 font-medium">Not Accepted</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <Hourglass className="h-5 w-5 text-yellow-600" />
                                <span className="text-yellow-700 font-medium">Under Review</span>
                              </div>
                            );
                          }
                        })()}
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/internships/${internship.internshipId}`}>View Details</Link>
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white" asChild>
                        <Link to={`/internships/${internship.internshipId}`}>View Details</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </>
  );

  // If student is logged in, use StudentLayout with sidebar
  if (isStudent) {
    return <StudentLayout>{content}</StudentLayout>;
  }

  // Otherwise, use regular layout with Header
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="container max-w-7xl mx-auto px-4 pt-28 pb-8">
        {content}
      </main>
    </div>
  );
}
