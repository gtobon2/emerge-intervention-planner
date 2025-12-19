'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { isMockMode } from '@/lib/supabase/config';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const validateForm = (): boolean => {
    setValidationError('');

    if (!fullName.trim()) {
      setValidationError('Please enter your full name');
      return false;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
      
      // In mock mode or if auto-confirmed, redirect to home
      if (isMockMode()) {
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      // Error is handled by the store
      console.error('Signup failed:', error);
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

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-movement" />
              Create Account
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
                      Supabase not configured. Account creation is simulated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && !isMockMode() && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-500 font-medium mb-1">Success!</p>
                    <p className="text-text-muted">
                      Please check your email to verify your account before signing in.
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
                  <p className="text-sm text-red-500">{error || validationError}</p>
                </div>
              </div>
            )}

            {/* Signup Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Jane Educator"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />

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

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  helperText="Minimum 6 characters"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            )}

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-movement hover:text-movement/80 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
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
