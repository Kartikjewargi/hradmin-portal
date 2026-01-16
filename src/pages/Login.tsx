import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, forgotPassword, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);
    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully',
      });
    } else {
      toast({
        title: 'Login failed',
        description: result.error || 'Invalid credentials',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await forgotPassword(email);
    if (result.success) {
      toast({
        title: 'Email sent',
        description: result.message,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* Simple background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-1/4 right-0 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <span className="font-display text-2xl font-bold text-primary-foreground">HR</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            HR Admin Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your workforce efficiently
          </p>
        </div>

        <Card className="shadow-lg border border-border/50 bg-background">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? 'Enter your email to receive reset instructions'
                : 'Sign in to access your HR dashboard'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => setIsForgotPassword(false)}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs font-medium"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-10 font-semibold"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Demo credentials hint */}
        <div className="mt-6">
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-xs font-semibold text-foreground">
              Demo Credentials
            </p>
            <div className="mt-2 text-xs font-mono text-primary">
              <div>admin@company.com</div>
              <div>admin123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
