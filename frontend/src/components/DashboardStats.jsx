import { useState, useEffect } from 'react';
import axios from 'axios';
import { CometCard } from './ui/comet-card';
import { Calendar, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardStats = ({ token }) => {
    const [borrowings, setBorrowings] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [borrowingsRes, allocationsRes] = await Promise.all([
                axios.get('http://localhost:3000/borrowings', { headers: { Authorization: token } }),
                axios.get('http://localhost:3000/allocations', { headers: { Authorization: token } })
            ]);
            setBorrowings(borrowingsRes.data);
            setAllocations(allocationsRes.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const activeBorrowings = borrowings.filter(b => !b.actual_return_date);
    const isOverdue = (expectedDate) => new Date(expectedDate) < new Date();

    if (loading) {
        return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <CometCard key={i}>
                            <div className="h-40 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                        </CometCard>
                    ))}
                </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Borrowings Widget */}
                        <CometCard>
                    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-yellow-500" />
                                </div>
                                <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                                    Active Borrowings
                                </h2>
                            </div>
                            <span className="text-2xl font-black text-yellow-500">
                                {activeBorrowings.length}
                            </span>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto pr-2">
                            {activeBorrowings.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                    <p className="text-sm font-medium">Clear for now</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeBorrowings.slice(0, 5).map((borrowing) => {
                                        const overdue = isOverdue(borrowing.expected_return_date);
                                        return (
                                            <div
                                                key={borrowing.id}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-colors",
                                                    overdue
                                                        ? "bg-red-500/5 border-red-500/20 hover:border-red-500/50"
                                                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-500/30"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate text-neutral-800 dark:text-neutral-200">
                                                            {borrowing.item_name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                                {borrowing.username}
                                                            </span>
                                                            <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                                            <span className="text-[10px] font-bold text-blue-500">
                                                                {borrowing.quantity} units
                                                            </span>
                                                        </div>
                                                        <p
                                                            className={cn(
                                                                "text-[11px] mt-2 font-medium flex items-center gap-1",
                                                                overdue ? "text-red-500" : "text-neutral-500"
                                                            )}
                                                        >
                                                            {overdue && <AlertCircle className="w-3 h-3" />}
                                                            {overdue ? "Overdue since " : "Due on "}
                                                            {new Date(borrowing.expected_return_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {overdue && (
                                                        <div className="px-2 py-1 bg-red-500 text-white text-[9px] rounded-full font-black uppercase tracking-tighter">
                                                            ACTION REQ
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {activeBorrowings.length > 5 && (
                                        <button className="w-full py-2 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                            View {activeBorrowings.length - 5} more →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CometCard>

            {/* Resource Allocations Widget */}
                        <CometCard>
                    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl">
                        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Share2 className="w-5 h-5 text-blue-500" />
                                </div>
                                <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                                    Resource Allocations
                                </h2>
                            </div>
                            <span className="text-2xl font-black text-blue-500">
                                {allocations.length}
                            </span>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto pr-2">
                            {allocations.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                                    <Share2 className="w-12 h-12 mx-auto mb-2 opacity-10" />
                                    <p className="text-sm font-medium">No active allocations</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {allocations.slice(0, 5).map((allocation) => (
                                        <div
                                            key={allocation.id}
                                            className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate text-neutral-800 dark:text-neutral-200">
                                                        {allocation.item_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                                            Project: {allocation.project_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[11px] rounded-full font-bold">
                                                    {allocation.allocated_quantity} units
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {allocations.length > 5 && (
                                        <button className="w-full py-2 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                            Full report →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CometCard>
        </div>
    );
};

export default DashboardStats;
