import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { History, User, Clock, BarChart3, Database, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { CometCard } from './ui/comet-card';
import { cn } from '@/lib/utils';

const HistoryLogs = ({ token }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('http://localhost:3000/history', { headers: { Authorization: token } });
            setLogs(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching history:', err);
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        const counts = {};
        logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            counts[date] = (counts[date] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .reverse()
            .slice(-7);
    }, [logs]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Activity Intelligence Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <CometCard className="lg:col-span-2">
                    <div className="border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur overflow-hidden shadow-2xl rounded-3xl">
                        <div className="bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 p-8">
                            <div className="flex items-center gap-3 text-xl font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-tight">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                </div>
                                System Interaction Analytics
                            </div>
                        </div>
                        <div className="h-[300px] p-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" className="dark:stroke-neutral-800" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#000',
                                            border: '1px solid #262626',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase'
                                        }}
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#3b82f6' : '#262626'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </CometCard>

                <CometCard>
                    <div className="border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur overflow-hidden shadow-2xl rounded-3xl flex flex-col justify-center items-center p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center">
                            <Database className="w-10 h-10 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-neutral-800 dark:text-neutral-100 uppercase">{logs.length}</h3>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Total Audit Entries</p>
                        </div>
                        <div className="w-full pt-6 border-t border-neutral-100 dark:border-neutral-800">
                            <p className="text-[11px] font-bold text-neutral-500 leading-relaxed uppercase">
                                Continuous monitoring of system-wide transactions, adjustments, and access events.
                            </p>
                        </div>
                    </div>
                </CometCard>
            </div>

            {/* Audit Stream */}
            <div className="space-y-8">
                <div className="px-2">
                    <h2 className="text-3xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <History className="w-7 h-7 text-blue-500" />
                        </div>
                        Immutable Audit Stream
                    </h2>
                </div>

                <CometCard>
                    <div className="bg-neutral-50/60 dark:bg-neutral-900/70 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden min-h-[500px]">
                    {logs.length === 0 ? (
                        <div className="text-center py-40 text-neutral-500">
                            <ShieldAlert className="w-20 h-20 mx-auto mb-4 opacity-5" />
                            <p className="text-xl font-medium uppercase tracking-widest">No audit data</p>
                            <p className="text-sm">Standard operations will trigger data logging.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {logs.map((log) => (
                                <div key={log.id} className="p-8 hover:bg-white dark:hover:bg-black/40 transition-colors group">
                                    <div className="flex items-start gap-6">
                                        <div className="mt-1">
                                            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center transition-transform group-hover:rotate-12">
                                                <User className="w-6 h-6 text-neutral-500" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-lg text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">{log.username}</span>
                                                    <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                                        {log.action}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed italic">
                                                "{log.details}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    </div>
                </CometCard>
            </div>
        </div>
    );
};

export default HistoryLogs;
