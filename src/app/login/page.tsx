'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle, Shield, Users, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth, type DemoUser } from '@/hooks/use-auth';
import { isMockMode } from '@/lib/supabase/config';

// Icon mapping for demo users based on role
const roleIcons = {
  admin: Shield,
  interventionist: Users,
  teacher: GraduationCap,
};

const roleColors = {
  admin: 'text-red-500 bg-red-500/10 border-red-500/30 hover:bg-red-500/20',
  interventionist: 'text-movement bg-movement/10 border-movement/30 hover:bg-movement/20',
  teacher: 'text-blue-500 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInAsDemoUser, isLoading, error, clearError, isAuthenticated, demoUsers, userRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect admin to admin page, others to home
      if (userRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, userRole, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signIn(email, password);
      // Redirect will happen via useEffect
    } catch (error) {
      // Error is handled by the store
      console.error('Login failed:', error);
    }
  };

  const handleDemoUserSelect = async (demoUser: DemoUser) => {
    clearError();
    try {
      await signInAsDemoUser(demoUser);
      // Redirect will happen via useEffect
    } catch (error) {
      console.error('Demo login failed:', error);
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
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              </div>
            )}

            {/* Demo User Selection - for mock mode */}
            {isMockMode() && !showEmailForm && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-text-muted mb-2">Select a user to continue:</p>
                </div>

                <div className="space-y-3">
                  {demoUsers.map((demoUser) => {
                    const Icon = roleIcons[demoUser.role];
                    return (
                      <button
                        key={demoUser.id}
                        onClick={() => handleDemoUserSelect(demoUser)}
                        disabled={isLoading}
                        className={`
                          w-full p-4 rounded-lg border-2 transition-all
                          flex items-center gap-4
                          ${roleColors[demoUser.role]}
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        <div className="p-2 rounded-full bg-white/50">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium">{demoUser.name}</p>
                          <p className="text-xs opacity-75 capitalize">{demoUser.role}</p>
                        </div>
                        {demoUser.role === 'admin' && (
                          <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                            Full Access
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-text-muted/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface text-text-muted">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowEmailForm(true)}
                >
                  Sign in with Email
                </Button>
              </div>
            )}

            {/* Email/Password Form - shown in non-mock mode or when user chooses email */}
            {(!isMockMode() || showEmailForm) && (
              <>
                {isMockMode() && showEmailForm && (
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="text-sm text-movement hover:text-movement/80 mb-4 flex items-center gap-1"
                  >
                    ← Back to user selection
                  </button>
                )}

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
              </>
            )}
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
