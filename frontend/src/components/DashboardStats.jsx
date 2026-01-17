import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Share2, AlertCircle, CheckCircle } from 'lucide-react';

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="animate-pulse">
                    <CardContent className="p-6">
                        <div className="h-32 bg-muted/20 rounded"></div>
                    </CardContent>
                </Card>
                <Card className="animate-pulse">
                    <CardContent className="p-6">
                        <div className="h-32 bg-muted/20 rounded"></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Active Borrowings Widget */}
            <Card className="shadow-lg hover-lift">
                <CardHeader className="bg-gradient-to-r from-warning/10 to-destructive/10 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Calendar className="w-5 h-5 text-warning" />
                        Active Borrowings ({activeBorrowings.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 max-h-64 overflow-y-auto">
                    {activeBorrowings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No active borrowings</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeBorrowings.slice(0, 5).map(borrowing => {
                                const overdue = isOverdue(borrowing.expected_return_date);
                                return (
                                    <div
                                        key={borrowing.id}
                                        className={`p-3 rounded-lg border-l-4 ${overdue
                                                ? 'bg-destructive/10 border-destructive'
                                                : 'bg-card border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{borrowing.item_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    By: {borrowing.username} • Qty: {borrowing.quantity}
                                                </p>
                                                <p className={`text-xs mt-1 ${overdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                                    {overdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                                                    Due: {new Date(borrowing.expected_return_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {overdue && (
                                                <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded-full font-semibold whitespace-nowrap">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {activeBorrowings.length > 5 && (
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                    +{activeBorrowings.length - 5} more borrowings
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Resource Allocations Widget */}
            <Card className="shadow-lg hover-lift">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Share2 className="w-5 h-5 text-primary" />
                        Resource Allocations ({allocations.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 max-h-64 overflow-y-auto">
                    {allocations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Share2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No resource allocations</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allocations.slice(0, 5).map(allocation => (
                                <div
                                    key={allocation.id}
                                    className="p-3 rounded-lg bg-card border-l-4 border-primary/30"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{allocation.item_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Project: {allocation.project_name}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-semibold whitespace-nowrap">
                                            {allocation.allocated_quantity} units
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {allocations.length > 5 && (
                                <p className="text-xs text-center text-muted-foreground pt-2">
                                    +{allocations.length - 5} more allocations
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardStats;
