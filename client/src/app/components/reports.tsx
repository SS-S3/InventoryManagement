import { useEffect, useState, useMemo } from "react";
import { formatDate, formatMonthYear } from "@/app/lib/date";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Filter, Download, Loader, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import {
  fetchSubmissionsByDepartment,
  DepartmentStats,
  fetchCompetitions,
  CompetitionRecord,
  fetchMonthlyToolActivity,
  fetchCategoryData,
  fetchUtilizationData,
  fetchSummaryStats,
  MonthlyToolActivity,
  CategoryData,
  UtilizationData,
  SummaryStats,
} from "@/app/lib/api";
import { useAuth } from "@/app/providers/auth-provider";

export function Reports() {
  const { token, user } = useAuth();
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [competitionsLoading, setCompetitionsLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [monthlyData, setMonthlyData] = useState<MonthlyToolActivity[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [utilizationData, setUtilizationData] = useState<UtilizationData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  useEffect(() => {
    if (token && user?.role === "admin") {
      loadDepartmentStats();
      loadCompetitions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  useEffect(() => {
    if (!(token && user?.role === 'admin')) return;
    const loadCharts = async () => {
      try {
        setChartsLoading(true);
        const [monthly, categories, utilization, summary] = await Promise.all([
          fetchMonthlyToolActivity(token),
          fetchCategoryData(token),
          fetchUtilizationData(token),
          fetchSummaryStats(token),
        ]);

        setMonthlyData(monthly || []);
        setCategoryData(categories || []);
        setUtilizationData(utilization || []);
        setSummaryStats(summary || null);
      } catch (err) {
        console.error('Failed to load reports charts', err);
      } finally {
        setChartsLoading(false);
      }
    };

    loadCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const loadDepartmentStats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchSubmissionsByDepartment(token);
      setDepartmentStats(data);
    } catch (error) {
      console.error("Failed to load department statistics", error);
    } finally {
      setLoading(false);
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

  const competitionsByDate = useMemo(() => {
    const map: Record<string, CompetitionRecord[]> = {};
    competitions.forEach((comp) => {
      if (comp.start_date) {
        const dateKey = comp.start_date.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(comp);
      }
      if (comp.end_date && comp.end_date !== comp.start_date) {
        const dateKey = comp.end_date.split('T')[0];
        if (!map[dateKey]) map[dateKey] = [];
        if (!map[dateKey].find((c) => c.id === comp.id)) {
          map[dateKey].push(comp);
        }
      }
    });
    return map;
  }, [competitions]);

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        <p className="text-neutral-500 mt-1">View detailed insights and statistics</p>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="flex items-center text-neutral-500">to</span>
              <input
                type="date"
                className="flex-1 px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Category
            </label>
            <select className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Categories</option>
              {categoryData.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Issued vs Returned */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Monthly Tool Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#171717', 
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="issued" fill="#3B82F6" name="Issued Tools" radius={[8, 8, 0, 0]} />
              <Bar dataKey="returned" fill="#10B981" name="Returned Tools" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tools by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#171717', 
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Submission Statistics */}
        {user?.role === "admin" && (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Task Submission Rate by Department (%)</h3>
            {loading ? (
              <div className="flex items-center justify-center h-80">
                <Loader className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentStats}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ department, submission_percentage }) => `${department.toUpperCase()}: ${submission_percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="submission_percentage"
                  >
                    {departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#171717', 
                      border: '1px solid #404040',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name, props) => {
                      if (name === "submission_percentage") {
                        return `${value}%`;
                      }
                      return value;
                    }}
                    labelFormatter={(label) => `${label.toUpperCase()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-neutral-400">
                No submission data available
              </div>
            )}
          </div>
        )}

        {/* Competition Calendar */}
        {user?.role === "admin" && (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-violet-500" />
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
                    
                    // Empty cells for days before the first of the month
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="h-12" />);
                    }
                    
                    // Days of the month
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
                          className={`h-12 rounded-lg flex flex-col items-center justify-center text-sm relative
                            ${isToday ? 'bg-blue-100 font-bold text-blue-700' : 'hover:bg-neutral-800'}
                            ${hasCompetition ? 'cursor-pointer' : ''}
                          `}
                          title={dayCompetitions.map((c) => c.name).join(', ')}
                        >
                          <span className={isToday ? 'text-blue-700' : 'text-neutral-300'}>{day}</span>
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
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-neutral-500 mb-2">Upcoming Competitions</p>
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
                            <span className="text-neutral-300 font-medium">{comp.name}</span>
                            {comp.start_date && (
                              <span className="text-neutral-400">
                                {formatDate(comp.start_date)}
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
        )}

        {/* Utilization Rate */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6">Weekly Utilization Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="week" stroke="#737373" />
              <YAxis stroke="#737373" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#171717', 
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                name="Utilization (%)"
                dot={{ fill: '#8B5CF6', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Submission Details Table */}
      {user?.role === "admin" && departmentStats.length > 0 && (
        <div className="mt-6 bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Department Submission Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-300">Department</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-300">Total Members</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-300">Submitted</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-300">Submission %</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-300">Passed</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-300">Failed</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((stat) => (
                  <tr key={stat.department} className="border-b border-gray-100 hover:bg-neutral-800">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 capitalize">{stat.department}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400 text-center">{stat.total_members}</td>
                    <td className="py-3 px-4 text-sm text-neutral-400 text-center">{stat.submitted_members}</td>
                    <td className="py-3 px-4 text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {stat.submission_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-green-600 text-center font-medium">{stat.passed_count}</td>
                    <td className="py-3 px-4 text-sm text-red-600 text-center font-medium">{stat.failed_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <p className="text-sm text-neutral-500 mb-1">Total Issues</p>
          <p className="text-3xl font-semibold text-white">{summaryStats ? summaryStats.totalIssues : '—'}</p>
          <p className="text-sm text-green-600 mt-2">{summaryStats?.trendText || ''}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <p className="text-sm text-neutral-500 mb-1">Average Duration</p>
          <p className="text-3xl font-semibold text-white">{summaryStats ? summaryStats.averageDuration : '—'}</p>
          <p className="text-sm text-neutral-400 mt-2">days per issue</p>
        </div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <p className="text-sm text-neutral-500 mb-1">Most Requested</p>
          <p className="text-xl font-semibold text-white">{summaryStats ? summaryStats.mostRequested : '—'}</p>
          <p className="text-sm text-neutral-400 mt-2">{summaryStats?.mostRequestedCount ? `${summaryStats.mostRequestedCount} times this month` : ''}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <p className="text-sm text-neutral-500 mb-1">Return Rate</p>
          <p className="text-3xl font-semibold text-white">{summaryStats && typeof summaryStats.returnRate === 'number' ? `${summaryStats.returnRate}%` : '—'}</p>
          <p className="text-sm text-green-600 mt-2">On-time returns</p>
        </div>
      </div>
    </div>
  );
}
