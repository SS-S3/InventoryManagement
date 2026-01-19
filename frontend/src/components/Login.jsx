import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CometCard } from './ui/comet-card';
import { LogIn, UserPlus, Lock, User as UserIcon } from 'lucide-react';
import HeroSectionOne from './HeroSectionOne';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HeroSectionOne title={"Welcome to Robotics Lab Inventory"} subtitle={"Sign in to access and manage your lab's inventory efficiently."}>
      <div className="relative z-10 mt-8 max-w-md mx-auto space-y-6">
        {error && (
          <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive text-sm">
            ⚠️ {error}
          </div>
        )}

        <CometCard>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur p-8 shadow-xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-3 text-sm font-semibold uppercase tracking-widest"
                disabled={loading}
              >
                {loading ? 'Processing…' : isRegister ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {isRegister ? '← Already have an account? Sign in' : "Don't have an account? Create one →"}
              </button>

              {!isRegister && (
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs text-neutral-600 dark:text-neutral-300">
                  💡 <strong>Demo:</strong> admin / admin123
                </div>
              )}
            </div>
          </div>
        </CometCard>
      </div>
    </HeroSectionOne>
  );
};

export default Login;