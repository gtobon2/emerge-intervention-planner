'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { isMockMode } from '@/lib/supabase/config';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signIn(email, password);
      router.push('/');
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
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

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-movement" />
              Sign In
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
                      Supabase not configured. Enter any credentials to continue.
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

            {/* Login Form */}
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

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-movement hover:text-movement/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-movement hover:text-movement/80 transition-colors font-medium"
                >
                  Sign up
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
