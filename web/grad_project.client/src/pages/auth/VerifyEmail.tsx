import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, user } = useAuth();

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (verificationAttempted.current) {
        return;
      }
      verificationAttempted.current = true;

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      const result = await verifyEmail(token);

      if (result.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(result.message || 'Verification failed');
      }
    };

    verify();
  }, [token, verifyEmail]);

  const getDashboardLink = (): string => {
    if (!user) return '/auth/signin';
    switch (user.role) {
      case 'student':
        return '/dashboard/student';
      case 'recruiter':
        return '/dashboard/recruiter';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--background)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-[var(--primary)]/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
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
        </div>

        <Card className="border-0 shadow-lg text-center">
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center"
                 style={{
                   backgroundColor: status === 'success'
                     ? 'rgb(34 197 94 / 0.1)'
                     : status === 'error'
                       ? 'rgb(239 68 68 / 0.1)'
                       : 'var(--muted)'
                 }}>
              {status === 'loading' && (
                <Loader2 className="h-8 w-8 text-[var(--primary)] animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-semibold">
              {status === 'loading' && 'Verifying...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {status === 'success' && (
              <Button className="rounded-full px-8 gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white" onClick={() => navigate(getDashboardLink())}>
                Go to Dashboard
              </Button>
            )}
            {status === 'error' && (
              <div className="space-y-3">
                <Button variant="outline" className="rounded-full" asChild>
                  <Link to="/auth/signin">Try signing in</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
