import { useState } from 'react';
import { History, Search, Filter, Download, Calendar, User, Package, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Activity {
  id: string;
  timestamp: string;
  memberName: string;
  memberId: string;
  action: 'issued' | 'returned' | 'requested';
  toolName: string;
  quantity: number;
  competition?: string;
  purpose: string;
  status: 'completed' | 'pending' | 'overdue';
}

export function ActivityTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [activities] = useState<Activity[]>([
    {
      id: '1',
      timestamp: '2026-01-19 10:30 AM',
      memberName: 'John Doe',
      memberId: 'LAB-2024-001',
      action: 'issued',
      toolName: 'Oscilloscope Model X200',
      quantity: 2,
      competition: 'Robotics Innovation Challenge 2026',
      purpose: 'Circuit testing for robot controller',
      status: 'completed',
    },
    {
      id: '2',
      timestamp: '2026-01-19 09:15 AM',
      memberName: 'Sarah Smith',
      memberId: 'LAB-2024-015',
      action: 'returned',
      toolName: 'Multimeter DMM-150',
      quantity: 1,
      competition: 'Circuit Design Workshop',
      purpose: 'Voltage measurement completed',
      status: 'completed',
    },
    {
      id: '3',
      timestamp: '2026-01-18 02:45 PM',
      memberName: 'Mike Johnson',
      memberId: 'LAB-2024-023',
      action: 'issued',
      toolName: 'Signal Generator SG-100',
      quantity: 1,
      competition: 'Circuit Design Workshop',
      purpose: 'Signal analysis for frequency response test',
      status: 'pending',
    },
    {
      id: '4',
      timestamp: '2026-01-18 11:20 AM',
      memberName: 'Emily Brown',
      memberId: 'LAB-2024-008',
      action: 'issued',
      toolName: 'Power Supply PS-5000',
      quantity: 1,
      purpose: 'Independent research project - power electronics',
      status: 'overdue',
    },
    {
      id: '5',
      timestamp: '2026-01-17 04:30 PM',
      memberName: 'David Lee',
      memberId: 'LAB-2024-042',
      action: 'returned',
      toolName: 'Function Generator FG-200',
      quantity: 1,
      competition: 'Circuit Design Workshop',
      purpose: 'Waveform generation test completed',
      status: 'completed',
    },
    {
      id: '6',
      timestamp: '2026-01-17 01:15 PM',
      memberName: 'Amanda Wilson',
      memberId: 'LAB-2024-035',
      action: 'issued',
      toolName: 'Soldering Station SS-75',
      quantity: 3,
      competition: 'Robotics Innovation Challenge 2026',
      purpose: 'PCB assembly for robot components',
      status: 'pending',
    },
    {
      id: '7',
      timestamp: '2026-01-16 03:00 PM',
      memberName: 'Robert Garcia',
      memberId: 'LAB-2024-019',
      action: 'returned',
      toolName: 'Logic Analyzer LA-100',
      quantity: 1,
      purpose: 'Digital circuit debugging - Senior project',
      status: 'completed',
    },
    {
      id: '8',
      timestamp: '2026-01-16 10:45 AM',
      memberName: 'Lisa Martinez',
      memberId: 'LAB-2024-027',
      action: 'issued',
      toolName: 'Oscilloscope Model X200',
      quantity: 1,
      competition: 'Robotics Innovation Challenge 2026',
      purpose: 'Testing motor control signals',
      status: 'pending',
    },
    {
      id: '9',
      timestamp: '2026-01-15 02:20 PM',
      memberName: 'James Taylor',
      memberId: 'LAB-2024-011',
      action: 'returned',
      toolName: 'Multimeter DMM-150',
      quantity: 2,
      competition: 'Circuit Design Workshop',
      purpose: 'Workshop completed - returned on time',
      status: 'completed',
    },
    {
      id: '10',
      timestamp: '2026-01-15 09:30 AM',
      memberName: 'Jennifer Anderson',
      memberId: 'LAB-2024-004',
      action: 'issued',
      toolName: 'Power Supply PS-5000',
      quantity: 1,
      competition: 'Circuit Design Workshop',
      purpose: 'Power circuit testing and validation',
      status: 'completed',
    },
  ]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'issued':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'returned':
        return <ArrowDownLeft className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'issued':
        return 'bg-blue-500/20 text-blue-400';
      case 'returned':
        return 'bg-green-500/20 text-green-400';
      case 'requested':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-neutral-800 text-neutral-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-blue-600';
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-neutral-400';
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = 
      activity.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.competition && activity.competition.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAction = filterAction === 'all' || activity.action === filterAction;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const handleExport = () => {
    if (filteredActivities.length === 0) {
      alert('No data to export');
      return;
    }

    // CSV headers
    const headers = [
      'ID',
      'Timestamp',
      'Member Name',
      'Member ID',
      'Action',
      'Tool Name',
      'Quantity',
      'Competition',
      'Purpose',
      'Status'
    ];

    // Convert activities to CSV rows
    const csvRows = filteredActivities.map(activity => [
      activity.id,
      activity.timestamp,
      `"${activity.memberName.replace(/"/g, '""')}"`,
      activity.memberId,
      activity.action,
      `"${activity.toolName.replace(/"/g, '""')}"`,
      activity.quantity,
      activity.competition ? `"${activity.competition.replace(/"/g, '""')}"` : '',
      `"${activity.purpose.replace(/"/g, '""')}"`,
      activity.status
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Activity Tracking</h2>
          <p className="text-neutral-500 mt-1">Complete history of all tool transactions</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Data
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Search by member, tool, or competition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Filter className="inline w-4 h-4 mr-1" />
              Action Type
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="issued">Issued</option>
              <option value="returned">Returned</option>
              <option value="requested">Requested</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date Range
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <p className="text-sm text-neutral-500">Total Activities</p>
          <p className="text-2xl font-semibold text-white mt-1">{filteredActivities.length}</p>
        </div>
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <p className="text-sm text-neutral-500">Tools Issued</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {filteredActivities.filter(a => a.action === 'issued').length}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <p className="text-sm text-neutral-500">Tools Returned</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {filteredActivities.filter(a => a.action === 'returned').length}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <p className="text-sm text-neutral-500">Overdue Items</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">
            {filteredActivities.filter(a => a.status === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm">
        <div className="p-6 border-b border-neutral-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Activity Timeline
          </h3>
        </div>

        <div className="divide-y divide-neutral-800">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-neutral-800 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">
                          {activity.toolName}
                          <span className="text-neutral-500 font-normal"> × {activity.quantity}</span>
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {activity.memberName} ({activity.memberId})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                          {activity.action}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-400 mb-2">{activity.purpose}</p>

                    {activity.competition && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                        <Package className="w-3 h-3" />
                        {activity.competition}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-neutral-500">No activities found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
