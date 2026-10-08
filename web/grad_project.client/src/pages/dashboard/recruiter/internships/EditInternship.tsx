import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { internshipApi, dataApi, type Internship } from '@/lib/api';
import { RecruiterLayout } from '@/components/RecruiterLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit } from 'lucide-react';

interface Skill {
  skillId: number;
  skillName: string;
  category: string;
}

export default function EditInternshipPage() {
  const { internshipId } = useParams<{ internshipId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [periodInWeeks, setPeriodInWeeks] = useState('12');
  const [stipend, setStipend] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [internshipId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [internshipRes, skillsRes] = await Promise.all([
        internshipApi.getById(Number(internshipId)),
        dataApi.getSkills(),
      ]);

      const internship: Internship = internshipRes.data;
      setTitle(internship.title);
      setDescription(internship.description);
      setLocation(internship.location || '');
      setStartDate(internship.startDate ? internship.startDate.split('T')[0] : '');
      setPeriodInWeeks(internship.periodInWeeks?.toString() || '12');
      setStipend(internship.stipend?.toString() || '');
      setDeadline(internship.deadline ? internship.deadline.split('T')[0] : '');
      setIsActive(internship.isActive);
      setSelectedSkillId(internship.skillId || undefined);

      setAvailableSkills(skillsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load internship details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await internshipApi.update(Number(internshipId), {
        title,
        description,
        location: location || undefined,
        startDate: startDate || undefined,
        periodInWeeks: periodInWeeks ? parseInt(periodInWeeks) : undefined,
        deadline: deadline || undefined,
        stipend: stipend ? parseFloat(stipend) : undefined,
        skillId: selectedSkillId,
        isActive,
      });

      navigate('/dashboard/recruiter');
    } catch (err: unknown) {
      console.error('Error updating internship:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update internship');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Edit className="h-8 w-8 text-primary" />
            Edit Internship
          </h1>
          <p className="text-muted-foreground mt-1">Update your internship posting</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the internship</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Internship Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Software Engineering Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the internship role and responsibilities"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Cairo, Egypt"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <DateInput
                    id="startDate"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodInWeeks">Duration (weeks)</Label>
                  <Input
                    id="periodInWeeks"
                    type="number"
                    min="1"
                    max="52"
                    value={periodInWeeks}
                    onChange={(e) => setPeriodInWeeks(e.target.value)}
                    placeholder="e.g., 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stipend">Stipend (Optional)</Label>
                  <Input
                    id="stipend"
                    type="number"
                    placeholder="e.g., 2500"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <DateInput
                    id="deadline"
                    value={deadline}
                    onChange={setDeadline}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={isActive ? 'active' : 'inactive'}
                    onChange={(e) => setIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skill</CardTitle>
              <CardDescription>Select the primary skill required for this internship</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="skill">Skill</Label>
                <select
                  id="skill"
                  value={selectedSkillId || ''}
                  onChange={(e) => setSelectedSkillId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  <option value="">Select a skill (optional)</option>
                  {availableSkills.map((skill) => (
                    <option key={skill.skillId} value={skill.skillId}>
                      {skill.skillName} ({skill.category})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1 gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/recruiter/internships')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </RecruiterLayout>
  );
}
