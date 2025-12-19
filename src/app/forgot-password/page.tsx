'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { isMockMode } from '@/lib/supabase/config';

export default function ForgotPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (error) {
      // Error is handled by the store
      console.error('Password reset failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-foundation flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-movement mb-2">EMERGE</h1>
          <p className="text-text-muted">Intervention Planner</p>
        </div>

        {/* Forgot Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-movement" />
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mock Mode Warning */}
            {isMockMode() && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-500 font-medium mb-1">Mock Mode</p>
                    <p className="text-text-muted">
                      Supabase not configured. Password reset is simulated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-500 font-medium mb-1">Email Sent!</p>
                    <p className="text-text-muted">
                      {isMockMode()
                        ? 'In production, a password reset link would be sent to your email.'
                        : 'Check your email for a password reset link. It may take a few minutes to arrive.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-text-muted mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-movement hover:text-movement/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-8">
          Research-based intervention planning for reading and math
        </p>
      </div>
    </div>
  );
}
