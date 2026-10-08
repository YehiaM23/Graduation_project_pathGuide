import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { internshipApi, type Internship } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { RecruiterLayout } from '@/components/RecruiterLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Edit, Trash2, Plus } from 'lucide-react';

export default function MyInternships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await internshipApi.getRecruiterInternships();
        setInternships(response.data || []);
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, []);

  const handleDeleteInternship = async (internshipId: number) => {
    if (!confirm('Are you sure you want to delete this internship?')) return;

    try {
      await internshipApi.delete(internshipId);
      setInternships(internships.filter((i) => i.internshipId !== internshipId));
    } catch (error) {
      console.error('Error deleting internship:', error);
      alert('Failed to delete internship');
    }
  };

  const formatDuration = (weeks?: number) => {
    if (!weeks) return 'Not specified';
    if (weeks >= 4) {
      const months = Math.round(weeks / 4);
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Internships</h1>
            <p className="text-muted-foreground mt-1">
              Manage your internship postings
            </p>
          </div>
          <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
            <Link to="/dashboard/recruiter/internships/new">
              <Plus className="mr-2 h-4 w-4" />
              Post Internship
            </Link>
          </Button>
        </div>

        {internships.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No internships posted yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first internship posting to start attracting candidates
              </p>
              <Button asChild className="gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
                <Link to="/dashboard/recruiter/internships/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Your First Internship
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {internships.map((internship) => (
              <Card key={internship.internshipId}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{internship.title}</CardTitle>
                      <CardDescription className="font-medium">{internship.companyName}</CardDescription>
                    </div>
                    <Badge variant={internship.isActive ? 'default' : 'secondary'}>
                      {internship.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {internship.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {internship.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{internship.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{formatDuration(internship.periodInWeeks)}</span>
                    </div>
                    {internship.stipend && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Stipend</span>
                        <span className="font-medium">{internship.stipend} EGP</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Applications</span>
                      <span className="font-medium">{internship.applicationsCount || 0}</span>
                    </div>
                    {internship.deadline && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-medium">{formatDate(internship.deadline)}</span>
                      </div>
                    )}
                    {internship.requiredSkill && (
                      <div className="pt-2">
                        <Badge variant="outline" className="text-xs">
                          {internship.requiredSkill.skillName}
                        </Badge>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to={`/dashboard/recruiter/internships/${internship.internshipId}/applications`}>
                          <Users className="mr-1 h-3 w-3" />
                          Applications
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/recruiter/internships/${internship.internshipId}/edit`}>
                          <Edit className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInternship(internship.internshipId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
}
