import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Compass, AlertCircle, ArrowRight, Briefcase } from 'lucide-react';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function RecruiterSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as LocationState)?.from?.pathname || '/dashboard/recruiter';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Check if user is a recruiter
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role !== 'recruiter') {
          // Wrong portal - logout and show error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setError('This login is for recruiters only. Please use the candidate login.');
          setIsLoading(false);
          return;
        }
      }
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--primary)]/5 blur-[100px]" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-10 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--primary)] via-[var(--accent)] to-[var(--secondary)] opacity-90" />
              <Compass className="relative h-7 w-7 text-white transition-transform group-hover:rotate-12" />
            </div>
            <span className="text-2xl font-semibold gradient-text">PathGuide</span>
          </Link>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Briefcase className="h-6 w-6 text-[var(--secondary)]" />
              <span className="text-sm font-medium text-[var(--secondary)]">Recruiter Portal</span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Welcome back</h1>
            <p className="text-[var(--muted-foreground)] leading-relaxed">Sign in to your recruiter account</p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold">Recruiter Sign In</CardTitle>
            <CardDescription className="text-base">Enter your email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-[var(--destructive)]/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-[var(--primary)] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11 rounded-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <div className="text-sm text-center text-[var(--muted-foreground)]">
              Don't have an account?{' '}
              <Link to="/auth/signup?type=recruiter" className="text-[var(--primary)] hover:underline font-semibold">
                Sign up as Recruiter
              </Link>
            </div>
            <div className="text-sm text-center text-[var(--muted-foreground)]">
              Are you a candidate?{' '}
              <Link to="/auth/student/signin" className="text-[var(--primary)] hover:underline font-semibold">
                Candidate Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
