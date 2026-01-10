'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { isMockMode } from '@/lib/supabase/config';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Redirect to home if already authenticated and this wasn't from a reset link
  useEffect(() => {
    // Check if we have the recovery token in URL (Supabase adds it automatically)
    const hash = window.location.hash;
    const hasRecoveryToken = hash.includes('type=recovery') || hash.includes('access_token');

    // If authenticated but no recovery token, user navigated here directly
    if (isAuthenticated && !hasRecoveryToken && !isMockMode()) {
      // This is fine - they might want to change their password
    }
  }, [isAuthenticated]);

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pass)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pass)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pass)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    setSuccess(false);

    // Validate passwords match
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      // Error is handled by the store
      console.error('Password update failed:', error);
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

        {/* Reset Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-movement" />
              Set New Password
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
                      Supabase not configured. Password update is simulated.
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
                    <p className="text-green-500 font-medium mb-1">Password Updated!</p>
                    <p className="text-text-muted">
                      Your password has been successfully updated. Redirecting to login...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {(error || validationError) && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{validationError || error}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-text-muted mb-6">
              Enter your new password below. Make sure it&apos;s at least 8 characters with uppercase, lowercase, and a number.
            </p>

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading || success}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
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
