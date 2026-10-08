import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi, dataApi, openCvBlob, type CvSuggestions } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Plus, User, Loader2, Upload, FileText, Download, Trash2, Sparkles } from 'lucide-react';

interface Skill {
  skillId: number;
  skillName: string;
}

interface Interest {
  interestId: number;
  interestName: string;
}

interface University {
  universityId: number;
  universityName: string;
}

interface Major {
  majorId: number;
  majorName: string;
}

interface CareerPath {
  careerPathId: number;
  careerPathName: string;
}

interface ProfileData {
  studentProfileId?: number;
  userName?: string;
  phone?: string;
  universityId?: number;
  majorId?: number;
  gpa?: number;
  graduationYear?: number;
  hasCv?: boolean;
  linkedinUrl?: string;
  githubUrl?: string;
  careerPathId?: number;
  bio?: string;
  skills?: Skill[];
  interests?: Interest[];
}

interface FormData {
  fullName: string;
  universityId: string;
  majorId: string;
  gpa: string;
  graduationYear: string;
  linkedinUrl: string;
  githubUrl: string;
  careerPathId: string;
  bio: string;
  phone: string;
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [_profile, setProfile] = useState<ProfileData | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  // CV upload state
  const [studentProfileId, setStudentProfileId] = useState<number | null>(null);
  const [hasCv, setHasCv] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [cvMessage, setCvMessage] = useState<Message>({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    universityId: '',
    majorId: '',
    gpa: '',
    graduationYear: '',
    linkedinUrl: '',
    githubUrl: '',
    careerPathId: '',
    bio: '',
    phone: '',
  });

  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, skillsRes, interestsRes, universitiesRes, majorsRes, careerPathsRes] = await Promise.all([
          studentApi.getProfile(),
          dataApi.getSkills(),
          dataApi.getInterests(),
          dataApi.getUniversities(),
          dataApi.getMajors(),
          dataApi.getCareerPaths(),
        ]);

        setProfile(profileRes.data);
        setSkills(skillsRes.data);
        setInterests(interestsRes.data);
        setUniversities(universitiesRes.data);
        setMajors(majorsRes.data);
        setCareerPaths(careerPathsRes.data);

        // Set form data
        const p = profileRes.data as ProfileData;
        setStudentProfileId(p.studentProfileId ?? null);
        setHasCv(!!p.hasCv);
        setFormData({
          fullName: p.userName || user?.name || '',
          universityId: p.universityId?.toString() || '',
          majorId: p.majorId?.toString() || '',
          gpa: p.gpa?.toString() || '',
          graduationYear: p.graduationYear?.toString() || '',
          linkedinUrl: p.linkedinUrl || '',
          githubUrl: p.githubUrl || '',
          careerPathId: p.careerPathId?.toString() || '',
          bio: p.bio || '',
          phone: p.phone || '',
        });

        setSelectedSkills(p.skills?.map(s => s.skillId) || []);
        setSelectedInterests(p.interests?.map(i => i.interestId) || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleInterest = (interestId: number) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const ALLOWED_CV_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const MAX_CV_BYTES = 5 * 1024 * 1024;

  const handleCvSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (ext !== '.pdf' && ext !== '.docx' && !ALLOWED_CV_TYPES.includes(file.type)) {
      setCvMessage({ type: 'error', text: 'Only PDF and DOCX files are allowed.' });
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setCvMessage({ type: 'error', text: 'File is too large. Maximum size is 5 MB.' });
      return;
    }

    setCvBusy(true);
    setCvMessage({ type: '', text: '' });
    try {
      await studentApi.uploadCv(file);
      setHasCv(true);
      setCvMessage({ type: 'success', text: 'CV uploaded successfully.' });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setCvMessage({ type: 'error', text: axiosError.response?.data?.message || 'Failed to upload CV.' });
    } finally {
      setCvBusy(false);
    }
  };

  const handleViewCv = async () => {
    if (studentProfileId == null) return;
    setCvMessage({ type: '', text: '' });
    try {
      const res = await studentApi.downloadCv(studentProfileId);
      await openCvBlob(res.data as Blob);
    } catch {
      setCvMessage({ type: 'error', text: 'Failed to open CV.' });
    }
  };

  const handleRemoveCv = async () => {
    setCvBusy(true);
    setCvMessage({ type: '', text: '' });
    try {
      await studentApi.deleteCv();
      setHasCv(false);
      setCvMessage({ type: 'success', text: 'CV removed.' });
    } catch {
      setCvMessage({ type: 'error', text: 'Failed to remove CV.' });
    } finally {
      setCvBusy(false);
    }
  };

  const handleAutofill = async () => {
    setCvBusy(true);
    setCvMessage({ type: '', text: '' });
    try {
      const res = await studentApi.parseCv();
      const s = res.data as CvSuggestions;
      if (!s.parsed) {
        setCvMessage({ type: '', text: "We couldn't read your CV automatically. Please fill the form manually." });
        return;
      }

      // Fill only empty scalar fields (non-destructive).
      const next = { ...formData };
      let filled = 0;
      const fillIf = (key: keyof FormData, value: string | number | null) => {
        if (value !== null && value !== undefined && value !== '' && !next[key]) {
          next[key] = String(value);
          filled++;
        }
      };
      fillIf('fullName', s.fullName);
      fillIf('phone', s.phone);
      fillIf('universityId', s.universityId);
      fillIf('majorId', s.majorId);
      fillIf('gpa', s.gpa);
      fillIf('graduationYear', s.graduationYear);
      fillIf('linkedinUrl', s.linkedinUrl);
      fillIf('githubUrl', s.githubUrl);
      fillIf('careerPathId', s.careerPathId);
      fillIf('bio', s.bio);
      setFormData(next);

      // Skills/interests only when the student hasn't picked any yet.
      if (selectedSkills.length === 0 && s.skillIds.length > 0) {
        setSelectedSkills(s.skillIds);
        filled += s.skillIds.length;
      }
      if (selectedInterests.length === 0 && s.interestIds.length > 0) {
        setSelectedInterests(s.interestIds);
        filled += s.interestIds.length;
      }

      setCvMessage(
        filled > 0
          ? { type: 'success', text: `Filled ${filled} field${filled === 1 ? '' : 's'} from your CV. Please review and save.` }
          : { type: '', text: 'Your CV was read, but all matching fields were already filled.' }
      );
    } catch (error: unknown) {
      // TEMP DIAGNOSTIC (revert): show the server's descriptive error.
      const axiosError = error as { response?: { data?: { message?: string } } };
      setCvMessage({ type: 'error', text: axiosError.response?.data?.message || 'Failed to parse CV. Please fill the form manually.' });
    } finally {
      setCvBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await studentApi.updateProfile({
        fullName: formData.fullName || null,
        universityId: formData.universityId ? parseInt(formData.universityId) : null,
        majorId: formData.majorId ? parseInt(formData.majorId) : null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        linkedinUrl: formData.linkedinUrl || null,
        githubUrl: formData.githubUrl || null,
        careerPathId: formData.careerPathId ? parseInt(formData.careerPathId) : null,
        bio: formData.bio || null,
        phone: formData.phone || null,
        skillIds: selectedSkills,
        interestIds: selectedInterests,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      const serverMessage = axiosError.response?.data?.message;
      const status = axiosError.response?.status;
      console.error('Server response:', axiosError.response?.data, 'Status:', status);
      setMessage({ type: 'error', text: serverMessage || `Failed to update profile (${status || 'unknown error'})` });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            Edit Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Update your personal information and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {message.text && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {/* CV / Resume — upload first, then optionally autofill the form */}
            <Card>
              <CardHeader>
                <CardTitle>CV / Resume</CardTitle>
                <CardDescription>
                  Upload your CV first. You can then autofill the form below from it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cvMessage.text && (
                  <Alert
                    variant={cvMessage.type === 'error' ? 'destructive' : 'default'}
                    className={cvMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                  >
                    <AlertDescription>{cvMessage.text}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-input bg-background p-4">
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-medium text-foreground">
                      {hasCv ? 'CV uploaded' : 'No CV uploaded yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF or DOCX, up to 5 MB</p>
                  </div>

                  {hasCv && (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={handleViewCv} disabled={cvBusy}>
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveCv} disabled={cvBusy}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </>
                  )}

                  <input
                    id="cvFile"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleCvSelect}
                    disabled={cvBusy}
                  />
                  <Button type="button" size="sm" disabled={cvBusy} asChild>
                    <label htmlFor="cvFile" className="cursor-pointer">
                      {cvBusy ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      {hasCv ? 'Replace' : 'Upload'}
                    </label>
                  </Button>
                </div>

                {hasCv && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAutofill}
                      disabled={cvBusy}
                    >
                      {cvBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                      Autofill from CV
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Autofill sends your CV text to OpenAI to extract fields. It only fills empty fields — review before saving.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your personal and academic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g., +1 234 567 8900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="universityId">University</Label>
                    <select
                      id="universityId"
                      name="universityId"
                      value={formData.universityId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select university</option>
                      {universities.map(u => (
                        <option key={u.universityId} value={u.universityId}>
                          {u.universityName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="majorId">Major</Label>
                    <select
                      id="majorId"
                      name="majorId"
                      value={formData.majorId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select major</option>
                      {majors.map(m => (
                        <option key={m.majorId} value={m.majorId}>
                          {m.majorName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      name="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={formData.gpa}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.75"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      name="graduationYear"
                      type="number"
                      min="2020"
                      max="2035"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      placeholder="e.g., 2025"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle>Links & Documents</CardTitle>
                <CardDescription>Your professional links and resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      name="linkedinUrl"
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      name="githubUrl"
                      type="url"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="careerPathId">Career Path</Label>
                    <select
                      id="careerPathId"
                      name="careerPathId"
                      value={formData.careerPathId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select career path</option>
                      {careerPaths.map(cp => (
                        <option key={cp.careerPathId} value={cp.careerPathId}>
                          {cp.careerPathName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>Select your technical and professional skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <button
                      key={skill.skillId}
                      type="button"
                      onClick={() => toggleSkill(skill.skillId)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedSkills.includes(skill.skillId)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {selectedSkills.includes(skill.skillId) ? (
                        <X className="h-3 w-3 inline mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 inline mr-1" />
                      )}
                      {skill.skillName}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
                <CardDescription>Select your areas of interest</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {interests.map(interest => (
                    <button
                      key={interest.interestId}
                      type="button"
                      onClick={() => toggleInterest(interest.interestId)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedInterests.includes(interest.interestId)
                          ? 'bg-accent text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {selectedInterests.includes(interest.interestId) ? (
                        <X className="h-3 w-3 inline mr-1" />
                      ) : (
                        <Plus className="h-3 w-3 inline mr-1" />
                      )}
                      {interest.interestName}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="px-8 gradient-btn hover:shadow-lg hover:shadow-primary/20 transition-all text-white">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
}
