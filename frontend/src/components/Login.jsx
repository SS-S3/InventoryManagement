import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, UserPlus, Lock, User as UserIcon } from 'lucide-react';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post('http://localhost:3000/register', { username, password, role });
        setError('');
        alert('✅ Registered successfully! Please login.');
        setIsRegister(false);
        setPassword('');
      } else {
        const res = await axios.post('http://localhost:3000/login', { username, password });
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-primary opacity-20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>

      <Card className="w-full max-w-md mx-4 glass border-2 border-white/10 shadow-2xl animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-2 animate-pulse-glow">
            {isRegister ? <UserPlus className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isRegister ? 'Join the Robotics Lab community' : 'Sign in to manage lab inventory'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive text-sm animate-fade-in">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input/50 border-border/50 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium text-foreground/80">Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-input/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">👤 User</SelectItem>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary hover:opacity-90 transition-all font-semibold text-white shadow-lg hover-lift"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                <>
                  {isRegister ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-primary hover:text-accent transition-colors"
            >
              {isRegister ? '← Already have an account? Sign in' : "Don't have an account? Create one →"}
            </Button>
          </div>

          {!isRegister && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground text-center">
              💡 <strong>Demo:</strong> admin / admin123
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;