import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LogIn, UserPlus, Lock, User as UserIcon } from 'lucide-react';

const AuthForm = ({ setToken }) => {
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
    <div className="relative z-10 mt-8 max-w-md mx-auto">
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
    </div>
  );
};

export default AuthForm;
