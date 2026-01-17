import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await axios.post('http://localhost:3000/register', { username, password, role });
        alert('Registered successfully');
        setIsRegister(false);
      } else {
        const res = await axios.post('http://localhost:3000/login', { username, password });
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isRegister ? 'Register' : 'Login'}</CardTitle>
          <CardDescription>
            {isRegister ? 'Create a new account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {isRegister && (
              <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full p-2 mb-2 border rounded">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            )}
            <Button type="submit" className="w-full">
              {isRegister ? 'Register' : 'Login'}
            </Button>
          </form>
          <Button
            variant="link"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-4 w-full"
          >
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;