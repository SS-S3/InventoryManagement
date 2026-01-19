import { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, Shield, Fingerprint, Lock } from 'lucide-react';
import { CometCard } from './ui/comet-card';
import { cn } from '@/lib/utils';

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
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Failed to update role');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <CometCard>
                <div className="border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur overflow-hidden shadow-2xl rounded-3xl">
                    <div className="bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-500" />
                                </div>
                                Access Control Panel
                            </div>
                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-full">
                                {users.length} Active Accounts
                            </span>
                        </div>
                    </div>
                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Identity</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">Authorization Level</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Operational Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                        user.role === 'admin' ? 'bg-blue-600/10 text-blue-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                                    )}>
                                                        {user.role === 'admin' ? <Shield className="w-6 h-6" /> : <Fingerprint className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">{user.username}</p>
                                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">ID: PTRN-{user.id.toString().padStart(4, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                                                        user.role === 'admin'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                                    )}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    {user.username === 'admin' ? (
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                                            <Lock className="w-3 h-3 text-neutral-500" />
                                                            <span className="text-[10px] font-black text-neutral-500 uppercase">SYSTEM PROTECTED</span>
                                                        </div>
                                                    ) : (
                                                        <Select
                                                            value={user.role}
                                                            onValueChange={(val) => updateUserRole(user.id, val)}
                                                        >
                                                            <SelectTrigger className="w-32 h-10 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                                                                <SelectItem value="user"><span className="text-[10px] font-black uppercase">Standard User</span></SelectItem>
                                                                <SelectItem value="admin"><span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Administrator</span></SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </CometCard>
        </div>
    );
};

export default UserManagement;
