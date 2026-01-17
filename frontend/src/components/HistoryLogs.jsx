import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { History, User, Clock, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
            .reverse() // Show chronological if backend sort is DESC
            .slice(-7); // Last 7 days/groups
    }, [logs]);

    if (loading) {
        return <div className="text-center p-8">Loading Audit Logs...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Activity Chart */}
            <Card className="shadow-lg border-2 border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent py-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Activity Trends (Last 7 Active Days)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card className="shadow-lg h-[400px] flex flex-col">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent py-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <History className="w-5 h-5 text-primary" />
                        Detailed Logs ({logs.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No activity recorded yet</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card transition-colors">
                                        <div className="mt-1">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    {log.username}
                                                    <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                                        {log.action}
                                                    </span>
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/80 break-words">{log.details}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HistoryLogs;
