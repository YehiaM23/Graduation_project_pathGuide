import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Compass, AlertCircle, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
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
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Forgot Password?</h1>
            <p className="text-[var(--muted-foreground)] leading-relaxed">
              No worries, we'll send you reset instructions
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          {success ? (
            <>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
                <CardDescription className="text-base">
                  We sent a password reset link to
                  <br />
                  <span className="font-medium text-[var(--foreground)]">{email}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-center text-[var(--muted-foreground)]">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-full"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                >
                  Try another email
                </Button>
                <div className="text-center pt-2">
                  <Link
                    to="/auth/student/signin"
                    className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-6">
                <div className="flex justify-center mb-2">
                  <div className="h-14 w-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-[var(--primary)]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-semibold text-center">Reset Password</CardTitle>
                <CardDescription className="text-base text-center">
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
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
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-full gradient-btn hover:shadow-lg hover:shadow-[var(--primary)]/20 transition-all text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      to="/auth/student/signin"
                      className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline font-medium"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
