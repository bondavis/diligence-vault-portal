
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/pages/Index';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Updated demo users with new role structure
  const demoUsers: User[] = [
    { id: '1', email: 'admin@bigbrandtire.com', name: 'Sarah Chen', role: 'bbt_execution_team', organization: 'BBT' },
    { id: '2', email: 'seller@techacq.com', name: 'Michael Torres', role: 'seller', organization: 'Seller', dealId: 'deal-1' },
    { id: '3', email: 'legal@sellercorp.com', name: 'Jennifer Walsh', role: 'seller_legal', organization: 'Seller', dealId: 'deal-1' },
    { id: '4', email: 'viewer@rsm.com', name: 'David Kim', role: 'rsm', organization: 'RSM' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const user = demoUsers.find(u => u.email === email);
      if (user && (password === 'demo123' || password === 'password')) {
        onLogin(user);
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">M&A Diligence Portal</h1>
          <p className="text-slate-600 mt-2">Secure document management for deal teams</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your deal room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p><strong>BBT Admin:</strong> admin@bigbrandtire.com</p>
                <p><strong>Seller:</strong> seller@techacq.com</p>
                <p><strong>Seller Legal:</strong> legal@sellercorp.com</p>
                <p><strong>RSM:</strong> viewer@rsm.com</p>
                <p className="mt-2"><strong>Password:</strong> demo123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
