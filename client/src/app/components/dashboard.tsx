import { useEffect, useState, useMemo } from "react";
import { Package, FileText, Clock, CheckCircle, Loader, ExternalLink, RefreshCw, Newspaper, Check, X, Trophy, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useAuthStore } from "@/app/stores/auth-store";
import { useDashboardStore } from "@/app/stores/dashboard-store";
import { useRequestsStore } from "@/app/stores/requests-store";
import { useBorrowingsStore } from "@/app/stores/borrowings-store";
import { useArticlesStore } from "@/app/stores/articles-store";
import { fetchSubmissionsByDepartment, DepartmentStats, fetchCompetitions, CompetitionRecord } from "@/app/lib/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export function Dashboard() {
  const { token, user } = useAuthStore();
  const { summary, fetchSummary, isLoading: dashboardLoading } = useDashboardStore();
  const { records: requests, fetchRequests, approveRequest, rejectRequest, isLoading: requestsLoading } = useRequestsStore();
  const { records: borrowings, fetchBorrowings, isLoading: borrowingsLoading } = useBorrowingsStore();
  const { articles, fetchedFor, fetchArticles, refreshArticles, isLoading: articlesLoading, isRefreshing } = useArticlesStore();

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [statsLoading, setStatsLoading] = useState(false);
  const [competitionsLoading, setCompetitionsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSummary(token).catch(() => {});
      fetchRequests(token, "pending").catch(() => {});
      fetchBorrowings(token).catch(() => {});
      fetchArticles(token).catch(() => {});
      if (user?.role === "admin") {
        loadDepartmentStats();
        loadCompetitions();
      }
    }
  }, [token, fetchSummary, fetchRequests, fetchBorrowings, fetchArticles, user?.role]);

  const loadDepartmentStats = async () => {
    if (!token) return;
    try {
      setStatsLoading(true);
      const data = await fetchSubmissionsByDepartment(token);
      setDepartmentStats(data);
    } catch (error) {
      console.error("Failed to load department statistics", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadCompetitions = async () => {
    if (!token) return;
    try {
      setCompetitionsLoading(true);
      const data = await fetchCompetitions(token);
      setCompetitions(data);
    } catch (error) {
      console.error("Failed to load competitions", error);
    } finally {
      setCompetitionsLoading(false);
    }
  };

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateInCompetition = (dateStr: string, comp: CompetitionRecord): boolean => {
    if (!comp.start_date) return false;
    const date = new Date(dateStr);
    const start = new Date(comp.start_date.split('T')[0]);
    const end = comp.end_date ? new Date(comp.end_date.split('T')[0]) : start;
    return date >= start && date <= end;
  };

  const getCompetitionsForDay = (day: number): CompetitionRecord[] => {
    const { year, month } = getDaysInMonth(calendarMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return competitions.filter((comp) => isDateInCompetition(dateStr, comp));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeBorrowings = borrowings.filter((b) => !b.returned_at);

  const stats = [
    {
      id: 1,
      title: "Total Items",
      value: String(summary?.metrics?.totalItems ?? 0),
      icon: Package,
      color: "bg-blue-500",
      change: "Inventory items",
    },
    {
      id: 2,
      title: "Active Borrowings",
      value: String(summary?.metrics?.activeBorrowings ?? activeBorrowings.length),
      icon: FileText,
      color: "bg-purple-500",
      change: "Currently issued",
    },
    {
      id: 3,
      title: "Pending Requests",
      value: String(summary?.metrics?.pendingRequests ?? pendingRequests.length),
      icon: Clock,
      color: "bg-orange-500",
      change: "Awaiting approval",
    },
    {
      id: 4,
      title: "Pending Submissions",
      value: String(summary?.metrics?.pendingSubmissions ?? 0),
      icon: CheckCircle,
      color: "bg-green-500",
      change: "Tasks to review",
    },
  ];

  const handleApprove = async (requestId: number) => {
    if (!token) return;
    setProcessingId(requestId);
    try {
      await approveRequest(token, requestId);
      await fetchBorrowings(token);
    } catch (error) {
      console.error("Failed to approve request", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!token) return;
    setProcessingId(requestId);
    try {
      await rejectRequest(token, requestId);
    } catch (error) {
      console.error("Failed to reject request", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefreshArticles = async () => {
    if (!token) return;
    try {
      await refreshArticles(token);
    } catch (error) {
      console.error("Failed to refresh articles", error);
    }
  };

  const isLoading = dashboardLoading || requestsLoading || borrowingsLoading;

  if (isLoading && !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Dashboard Overview</h2>
        <p className="text-neutral-400 mt-1">Welcome back, {user?.full_name || user?.username}! Here's what's happening.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={stat.color + " p-3 rounded-lg"}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-neutral-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-semibold text-white mb-2">{stat.value}</p>
              <p className="text-sm text-neutral-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approval Queue */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Approval Queue</h3>
            <p className="text-sm text-neutral-400 mt-1">Requests awaiting your approval</p>
          </div>
          <div className="p-6">
            {pendingRequests.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="p-4 border border-neutral-800 rounded-lg hover:border-violet-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">{request.title}</h4>
                        <p className="text-sm text-neutral-400">{request.tool_name}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-orange-500/20 text-orange-400">Pending</span>
                    </div>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <p>By: {request.requester_name || request.username}</p>
                      <p>Requested: {new Date(request.requested_at).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleApprove(request.id)} disabled={processingId === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm font-medium disabled:opacity-50">
                        <Check className="w-4 h-4" />Approve
                      </button>
                      <button onClick={() => handleReject(request.id)} disabled={processingId === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm font-medium disabled:opacity-50">
                        <X className="w-4 h-4" />Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Borrowings */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Active Borrowings</h3>
            <p className="text-sm text-neutral-400 mt-1">Tools currently issued</p>
          </div>
          <div className="p-6">
            {activeBorrowings.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No active borrowings</p>
            ) : (
              <div className="space-y-4">
                {activeBorrowings.slice(0, 5).map((borrowing) => {
                  const isOverdue = borrowing.expected_return_date && new Date(borrowing.expected_return_date) < new Date();
                  return (
                    <div key={borrowing.id} className="p-4 border border-neutral-800 rounded-lg hover:border-violet-500/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">{borrowing.tool_name}</h4>
                        {isOverdue && <span className="text-xs font-medium px-2 py-1 rounded bg-red-500/20 text-red-400">Overdue</span>}
                      </div>
                      <div className="text-sm text-neutral-400 space-y-1">
                        <p>By: {borrowing.borrower_name || borrowing.username}</p>
                        <p>Borrowed: {new Date(borrowing.borrowed_at).toLocaleDateString()}</p>
                        {borrowing.expected_return_date && <p>Due: {new Date(borrowing.expected_return_date).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Robotics Articles Panel */}
      <div className="mt-6 bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-violet-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Latest Robotics News</h3>
              {fetchedFor && <p className="text-xs text-neutral-500">Last updated: {fetchedFor}</p>}
            </div>
          </div>
          <button onClick={handleRefreshArticles} disabled={isRefreshing} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50" title="Refresh articles">
            <RefreshCw className={"w-5 h-5 " + (isRefreshing ? "animate-spin" : "")} />
          </button>
        </div>
        <div className="p-6">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-8"><Loader className="w-6 h-6 text-violet-400 animate-spin" /></div>
          ) : articles.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No articles available. Click refresh to fetch latest news.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.slice(0, 6).map((article) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="p-4 border border-neutral-800 rounded-lg hover:border-violet-500/50 hover:bg-neutral-800/50 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-violet-300">{article.title}</h4>
                    <ExternalLink className="w-4 h-4 text-neutral-500 flex-shrink-0 group-hover:text-violet-400" />
                  </div>
                  {article.source && <p className="text-xs text-neutral-500 mt-2">{article.source}</p>}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Competition Calendar & Department Stats Row */}
      {user?.role === "admin" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Competition Calendar */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Competition Calendar
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-400" />
                </button>
                <span className="text-sm font-medium text-neutral-300 min-w-[140px] text-center">
                  {formatMonthYear(calendarMonth)}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </button>
              </div>
            </div>
            {competitionsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-neutral-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(calendarMonth);
                    const days = [];
                    
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="h-10" />);
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dayCompetitions = getCompetitionsForDay(day);
                      const hasCompetition = dayCompetitions.length > 0;
                      const today = new Date();
                      const isToday = 
                        calendarMonth.getMonth() === today.getMonth() &&
                        calendarMonth.getFullYear() === today.getFullYear() &&
                        day === today.getDate();
                      
                      days.push(
                        <div
                          key={day}
                          className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm relative
                            ${isToday ? 'bg-violet-500/20 font-bold text-violet-300' : 'hover:bg-neutral-800'}
                            ${hasCompetition ? 'cursor-pointer' : ''}
                          `}
                          title={dayCompetitions.map((c) => c.name).join(', ')}
                        >
                          <span className={isToday ? 'text-violet-300' : 'text-neutral-300'}>{day}</span>
                          {hasCompetition && (
                            <div className="flex gap-0.5 mt-0.5">
                              {dayCompetitions.slice(0, 3).map((comp, idx) => (
                                <div
                                  key={comp.id}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
                {/* Upcoming competitions legend */}
                {competitions.filter((c) => {
                  if (!c.start_date) return false;
                  const startDate = new Date(c.start_date);
                  return startDate >= new Date() || (c.end_date && new Date(c.end_date) >= new Date());
                }).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-400 mb-2">Upcoming Competitions</p>
                    <div className="space-y-1">
                      {competitions
                        .filter((c) => {
                          if (!c.start_date) return false;
                          const startDate = new Date(c.start_date);
                          return startDate >= new Date() || (c.end_date && new Date(c.end_date) >= new Date());
                        })
                        .slice(0, 3)
                        .map((comp, idx) => (
                          <div key={comp.id} className="flex items-center gap-2 text-xs">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-neutral-300 truncate">{comp.name}</span>
                            {comp.start_date && (
                              <span className="text-neutral-500 ml-auto">
                                {new Date(comp.start_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Department Submission Statistics */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Task Submission Rate by Department</h3>
            {statsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={departmentStats}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ department, submission_percentage }) => `${department.toUpperCase()}: ${submission_percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="submission_percentage"
                  >
                    {departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-500">
                No submission data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
