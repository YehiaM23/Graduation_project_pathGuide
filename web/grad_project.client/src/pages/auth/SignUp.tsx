import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dataApi, authApi, studentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, AlertCircle, Users, Briefcase, ArrowRight, ArrowLeft, Plus, X, Upload, FileText, Loader2 } from 'lucide-react';

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

interface Skill {
  skillId: number;
  skillName: string;
}

interface Interest {
  interestId: number;
  interestName: string;
}

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerStudent, registerRecruiter } = useAuth();

  // Step management (only for students)
  const [step, setStep] = useState(1);

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Student fields - Step 1
  const [universityId, setUniversityId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Student fields - Step 2
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [careerPathId, setCareerPathId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);

  // Dropdown data
  const [universities, setUniversities] = useState<University[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);

  // Recruiter fields
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [website, setWebsite] = useState('');

  // CV upload (student only): parsed to prefill the form, stored after sign-up.
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvConsent, setCvConsent] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const [cvNote, setCvNote] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'student' || roleParam === 'recruiter') {
      setRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [universitiesRes, majorsRes, careerPathsRes, skillsRes, interestsRes] = await Promise.all([
          dataApi.getUniversities(),
          dataApi.getMajors(),
          dataApi.getCareerPaths(),
          dataApi.getSkills(),
          dataApi.getInterests(),
        ]);
        setUniversities(universitiesRes.data);
        setMajors(majorsRes.data);
        setCareerPaths(careerPathsRes.data);
        setSkills(skillsRes.data);
        setInterests(interestsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

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

  const parseAndPrefill = async (file: File) => {
    setCvBusy(true);
    setCvNote('');
    try {
      const { data: s } = await authApi.parseCv(file);
      if (!s.parsed) {
        setCvNote("We couldn't read your CV automatically — please fill the form below.");
        return;
      }

      // Prefill only empty fields (non-destructive).
      let filled = 0;
      if (s.fullName && !name) { setName(s.fullName); filled++; }
      if (s.email && !email) { setEmail(s.email); filled++; }
      if (s.phone && !phone) { setPhone(s.phone); filled++; }
      if (s.universityId && !universityId) { setUniversityId(String(s.universityId)); filled++; }
      if (s.majorId && !majorId) { setMajorId(String(s.majorId)); filled++; }
      if (s.graduationYear && !graduationYear) { setGraduationYear(String(s.graduationYear)); filled++; }
      if (s.linkedinUrl && !linkedinUrl) { setLinkedinUrl(s.linkedinUrl); filled++; }
      if (s.githubUrl && !githubUrl) { setGithubUrl(s.githubUrl); filled++; }
      if (s.careerPathId && !careerPathId) { setCareerPathId(String(s.careerPathId)); filled++; }
      if (selectedSkills.length === 0 && s.skillIds.length > 0) { setSelectedSkills(s.skillIds); filled += s.skillIds.length; }
      if (selectedInterests.length === 0 && s.interestIds.length > 0) { setSelectedInterests(s.interestIds); filled += s.interestIds.length; }

      setCvNote(
        filled > 0
          ? `Filled ${filled} field${filled === 1 ? '' : 's'} from your CV — review them below.`
          : 'Your CV was read; the matching fields were already filled.'
      );
    } catch (err: unknown) {
      // TEMP DIAGNOSTIC (revert): show the server's descriptive error.
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCvNote(axiosErr.response?.data?.message || "We couldn't autofill from your CV right now — please fill the form below.");
    } finally {
      setCvBusy(false);
    }
  };

  const handleCvSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    const dot = file.name.lastIndexOf('.');
    const ext = dot >= 0 ? file.name.toLowerCase().slice(dot) : '';
    if (ext !== '.pdf' && ext !== '.docx') {
      setCvNote('');
      setError('Only PDF and DOCX files are allowed for the CV.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvNote('');
      setError('CV file is too large. Maximum size is 5 MB.');
      return;
    }

    setError('');
    setCvFile(file);
    setCvNote('');

    if (!cvConsent) {
      setCvNote('CV attached. Tick the consent box to autofill the form from it, or just continue filling manually.');
      return;
    }
    await parseAndPrefill(file);
  };

  const handleConsentChange = (checked: boolean) => {
    setCvConsent(checked);
    // If a CV is already attached, ticking consent autofills immediately.
    if (checked && cvFile && !cvBusy) {
      void parseAndPrefill(cvFile);
    }
  };

  const handleStep1Next = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate step 1 fields
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (role === 'student' && (!universityId || !majorId || !graduationYear)) {
      setError('Please fill in all required fields');
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let result;

    if (role === 'student') {
      result = await registerStudent({
        email,
        password,
        name,
        phone: phone || undefined,
        universityId: universityId ? parseInt(universityId) : undefined,
        majorId: majorId ? parseInt(majorId) : undefined,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
        // Step 2 fields
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        careerPathId: careerPathId ? parseInt(careerPathId) : undefined,
        skillIds: selectedSkills.length > 0 ? selectedSkills : undefined,
        interestIds: selectedInterests.length > 0 ? selectedInterests : undefined,
      });
    } else {
      if (!companyName) {
        setError('Company name is required');
        setIsLoading(false);
        return;
      }
      result = await registerRecruiter({
        email,
        password,
        name,
        phone,
        companyName,
        companyDescription: companyDescription || undefined,
        website: website || undefined,
      });
    }

    if (result.success) {
      // Now authenticated (registration returns a JWT). Store the CV file if one
      // was attached during sign-up. skipAuthRedirect keeps a 401 here from
      // wiping the just-created session; a failure is non-blocking (the student
      // can upload it later on their profile).
      if (role === 'student' && cvFile) {
        try {
          await studentApi.uploadCv(cvFile, { skipAuthRedirect: true });
        } catch {
          console.warn('CV upload after sign-up failed; it can be added on the profile page.');
        }
      }
      // Email verification is disabled — the account is active and signed in.
      navigate(role === 'recruiter' ? '/dashboard/recruiter' : '/dashboard/student');
    } else {
      setError(result.message || 'Registration failed');
    }

    setIsLoading(false);
  };

  const renderStep1 = () => (
    <form onSubmit={role === 'student' ? handleStep1Next : handleSubmit} className="mt-6 space-y-5">
      {error && (
        <Alert variant="destructive" className="border-[var(--destructive)]/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {role === 'student' && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--primary)]" />
            <p className="text-sm font-medium">Upload your CV to autofill the form (optional)</p>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={cvConsent}
              onChange={(e) => handleConsentChange(e.target.checked)}
            />
            I agree to send my CV text to OpenAI to extract profile fields.
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <input
              id="signupCvFile"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleCvSelect}
              disabled={cvBusy}
            />
            <Button type="button" variant="outline" size="sm" disabled={cvBusy} asChild>
              <label htmlFor="signupCvFile" className="cursor-pointer">
                {cvBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                {cvFile ? 'Change CV' : 'Choose CV'}
              </label>
            </Button>
            {cvFile && <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">{cvFile.name}</span>}
          </div>

          {cvNote && <p className="text-xs text-[var(--primary)]">{cvNote}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full name
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone {role === 'student' && <span className="text-[var(--muted-foreground)]">(Optional)</span>}
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            required={role === 'recruiter'}
            className="h-11"
          />
        </div>
      </div>

      <TabsContent value="student" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="universityId" className="text-sm font-medium">
              University
            </Label>
            <select
              id="universityId"
              value={universityId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setUniversityId(e.target.value)}
              required={role === 'student'}
              className="flex h-11 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <option value="">Select university</option>
              {universities.map((u) => (
                <option key={u.universityId} value={u.universityId}>
                  {u.universityName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="majorId" className="text-sm font-medium">
              Major
            </Label>
            <select
              id="majorId"
              value={majorId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setMajorId(e.target.value)}
              required={role === 'student'}
              className="flex h-11 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            >
              <option value="">Select major</option>
              {majors.map((m) => (
                <option key={m.majorId} value={m.majorId}>
                  {m.majorName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="graduationYear" className="text-sm font-medium">
            Graduation year
          </Label>
          <Input
            id="graduationYear"
            type="number"
            placeholder="2025"
            value={graduationYear}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setGraduationYear(e.target.value)}
            required={role === 'student'}
            min="2020"
            max="2035"
            className="h-11"
          />
        </div>
      </TabsContent>

      <TabsContent value="recruiter" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium">
            Company name
          </Label>
          <Input
            id="companyName"
            placeholder="Your company name"
            value={companyName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
            required={role === 'recruiter'}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyDescription" className="text-sm font-medium">
            Description <span className="text-[var(--muted-foreground)]">(Optional)</span>
          </Label>
          <Textarea
            id="companyDescription"
            placeholder="Tell us about your company"
            value={companyDescription}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCompanyDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium">
            Website <span className="text-[var(--muted-foreground)]">(Optional)</span>
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://yourcompany.com"
            value={website}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
            className="h-11"
          />
        </div>
      </TabsContent>

      <Button type="submit" className="w-full h-11 rounded-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white" disabled={isLoading}>
        {role === 'student' ? (
          <>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        ) : (
          isLoading ? 'Creating account...' : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )
        )}
      </Button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-[var(--destructive)]/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Links & Documents */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Links & Documents</CardTitle>
          <CardDescription>Your professional links and resume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="text-sm font-medium">
                LinkedIn URL <span className="text-[var(--muted-foreground)]">(Optional)</span>
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLinkedinUrl(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUrl" className="text-sm font-medium">
                GitHub URL <span className="text-[var(--muted-foreground)]">(Optional)</span>
              </Label>
              <Input
                id="githubUrl"
                type="url"
                placeholder="https://github.com/yourusername"
                value={githubUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGithubUrl(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="careerPathId" className="text-sm font-medium">
                Career Path <span className="text-[var(--muted-foreground)]">(Optional)</span>
              </Label>
              <select
                id="careerPathId"
                value={careerPathId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setCareerPathId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              >
                <option value="">Select career path</option>
                {careerPaths.map((cp) => (
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
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Skills</CardTitle>
          <CardDescription>Select your technical and professional skills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...skills].sort((a, b) => a.skillName.localeCompare(b.skillName)).map((skill) => (
              <button
                key={skill.skillId}
                type="button"
                onClick={() => toggleSkill(skill.skillId)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedSkills.includes(skill.skillId)
                    ? 'bg-primary text-white'
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
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Interests</CardTitle>
          <CardDescription>Select your areas of interest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...interests].sort((a, b) => (a.interestName || '').localeCompare(b.interestName || '')).map((interest) => (
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

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-center max-w-[60%] mx-auto">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1 h-12 rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 rounded-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
          {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[var(--primary)]/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
      </div>
      <div className={`w-full ${step === 2 ? 'max-w-3xl' : 'max-w-2xl'}`}>
        <div className="text-center mb-10 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--primary)] via-[var(--accent)] to-[var(--secondary)] opacity-90" />
              <Compass className="relative h-7 w-7 text-white transition-transform group-hover:rotate-12" />
            </div>
            <span className="text-2xl font-semibold gradient-text">PathGuide</span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Create your account</h1>
            <p className="text-[var(--muted-foreground)] leading-relaxed">
              {role === 'student' && step === 2
                ? 'Tell us about your skills and interests'
                : 'Join PathGuide and start your career journey'}
            </p>
          </div>

          {/* Step Indicator for Students */}
          {role === 'student' && (
            <div className="flex items-center justify-center gap-3">
              <div className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium min-w-[160px] justify-center ${
                step === 1
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary'
              }`}>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">1</span>
                Basic Info
              </div>
              <div className="w-8 h-0.5 bg-muted" />
              <div className={`flex items-center gap-2 px-6 py-3 rounded-full text-base font-medium min-w-[160px] justify-center ${
                step === 2
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                  step === 2 ? 'bg-white/20' : 'bg-muted-foreground/20'
                }`}>2</span>
                Profile Details
              </div>
            </div>
          )}
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className={`space-y-1 ${step === 2 ? 'pb-2' : 'pb-6'}`}>
            <CardTitle className="text-2xl font-semibold">
              {role === 'student' && step === 2 ? 'Complete your profile' : 'Sign up'}
            </CardTitle>
            <CardDescription className="text-base">
              {role === 'student' && step === 2
                ? 'Add your professional links, skills, and interests'
                : 'Choose your role and create your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <Tabs value={role} onValueChange={(value) => { setRole(value); setStep(1); setCvFile(null); setCvNote(''); setCvConsent(false); setError(''); }} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-[var(--secondary)]/50">
                  <TabsTrigger value="student" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Candidate</span>
                  </TabsTrigger>
                  <TabsTrigger value="recruiter" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Recruiter</span>
                  </TabsTrigger>
                </TabsList>
                {renderStep1()}
              </Tabs>
            ) : (
              renderStep2()
            )}
          </CardContent>
          {step === 1 && (
            <CardFooter className="flex flex-col gap-4 pt-6">
              <div className="text-sm text-center text-[var(--muted-foreground)]">
                Already have an account?{' '}
                <Link to="/auth/signin" className="text-[var(--primary)] hover:underline font-semibold">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
