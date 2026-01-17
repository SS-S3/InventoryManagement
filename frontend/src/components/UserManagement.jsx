import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Users, Shield, UserCog, Check } from 'lucide-react';

const UserManagement = ({ token }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:3000/users', { headers: { Authorization: token } });
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            await axios.put(`http://localhost:3000/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: token } }
            );
            // Optimistic update or refetch
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            // Could add toast here
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update role');
        }
    };

    if (loading) return <div className="text-center p-8">Loading Users...</div>;

    return (
        <Card className="shadow-lg border-2 border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    User Management
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4">Current Role</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                                            {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserCog className="w-4 h-4" />}
                                        </div>
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.role === 'admin'
                                                ? 'bg-accent/10 text-accent border border-accent/20'
                                                : 'bg-primary/10 text-primary border border-primary/20'
                                            }`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 w-40">
                                            <Select
                                                value={user.role}
                                                onValueChange={(val) => updateUserRole(user.id, val)}
                                                disabled={user.username === 'admin'} // Prevent creating a lockout if this is the super admin
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserManagement;
