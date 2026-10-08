import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Mail, ArrowRight } from 'lucide-react';

export default function VerifyPending() {
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
            <div className="mx-auto h-16 w-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-[var(--primary)]" />
            </div>
            <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent you a verification link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <p className="text-[var(--muted-foreground)]">
              Click the link in the email to verify your account and get started with PathGuide.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button variant="outline" className="rounded-full">
                Resend verification email
              </Button>
            </div>
            <div className="pt-4 border-t">
              <Button variant="link" asChild>
                <Link to="/auth/signin">
                  Back to sign in <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
