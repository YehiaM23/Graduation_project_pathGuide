import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, GraduationCap, Briefcase, ArrowRight } from 'lucide-react';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[var(--primary)]/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
      </div>
      <div className="w-full max-w-lg">
        <div className="text-center mb-10 space-y-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[var(--primary)] via-[var(--accent)] to-[var(--secondary)] opacity-90" />
              <Compass className="relative h-7 w-7 text-white transition-transform group-hover:rotate-12" />
            </div>
            <span className="text-2xl font-semibold gradient-text">PathGuide</span>
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Welcome back</h1>
            <p className="text-[var(--muted-foreground)] leading-relaxed">Choose how you want to sign in</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Student Login Card */}
          <Link to="/auth/student/signin">
            <Card className="border-2 border-transparent hover:border-[var(--primary)]/30 shadow-lg hover:shadow-xl transition-all cursor-pointer group h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Candidate</CardTitle>
                <CardDescription className="text-sm">
                  Access your learning path, track progress, and find internships
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-center text-[var(--primary)] font-medium text-sm group-hover:gap-2 transition-all">
                  Sign in as Candidate
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Recruiter Login Card */}
          <Link to="/auth/recruiter/signin">
            <Card className="border-2 border-transparent hover:border-[var(--secondary)]/30 shadow-lg hover:shadow-xl transition-all cursor-pointer group h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--secondary)] to-[var(--accent)]">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Recruiter</CardTitle>
                <CardDescription className="text-sm">
                  Post internships, review applications, and find talented candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-center text-[var(--secondary)] font-medium text-sm group-hover:gap-2 transition-all">
                  Sign in as Recruiter
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-[var(--primary)] hover:underline font-semibold">
              Sign up
            </Link>
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            <Link to="/auth/admin/signin" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:underline">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
