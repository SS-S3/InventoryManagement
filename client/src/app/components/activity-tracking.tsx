import { useState, useEffect } from 'react';
import { History, Search, Filter, Download, Calendar, User, Package, ArrowUpRight, ArrowDownLeft, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/app/stores/auth-store';
import { fetchHistory, HistoryRecord } from '@/app/lib/api';
import { formatDate, formatDateTime } from '@/app/lib/date';

interface Activity {
  id: string;
  timestamp: string;
  memberName: string;
  memberId: string;
  action: 'issued' | 'returned' | 'requested' | 'other';
  toolName: string;
  quantity: number;
  competition?: string;
  purpose: string;
  status: 'completed' | 'pending' | 'overdue';
}

// Pagination constants
const PAGE_SIZE = 20;
const MAX_RECORDS = 200;

export function ActivityTracking() {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (token) {
      fetchHistoryData(1);
    }
  }, [token]);

  const fetchHistoryData = async (page: number = 1) => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetchHistory(token, { limit: PAGE_SIZE, page });
      
      setHistoryRecords(response.records || []);
      setTotalRecords(Math.min(response.total || 0, MAX_RECORDS));
      setTotalPages(Math.min(response.totalPages || Math.ceil((response.total || 0) / PAGE_SIZE), Math.ceil(MAX_RECORDS / PAGE_SIZE)));
      setCurrentPage(page);
      
      // Transform history records into activity format
      const transformedActivities = transformHistoryToActivities(response.records || []);
      setActivities(transformedActivities);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchHistoryData(newPage);
    }
  };

  const transformHistoryToActivities = (records: HistoryRecord[]): Activity[] => {
    return records.map((record) => {
      // Parse action type and details
      const actionType = record.action?.toLowerCase() || 'other';
      let parsedAction: 'issued' | 'returned' | 'requested' | 'other' = 'other';
      let toolName = 'Unknown';
      let quantity = 1;
      let purpose = record.details || 'No details available';
      
      // Determine action type based on history action
      if (actionType.includes('issue') || actionType.includes('borrow')) {
        parsedAction = 'issued';
      } else if (actionType.includes('return')) {
        parsedAction = 'returned';
      } else if (actionType.includes('request')) {
        parsedAction = 'requested';
      }
      
      // Try to extract tool name and quantity from details
      if (record.details) {
        // Look for patterns like "item 5" or "request 10"
        const itemMatch = record.details.match(/(?:item|tool|request|borrowing)\s+(\d+)/i);
        if (itemMatch) {
          toolName = `Item #${itemMatch[1]}`;
        }
        
        // Look for quantity patterns
        const qtyMatch = record.details.match(/(?:qty|quantity)\s+(\d+)/i);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1], 10);
        }
      }
      
      // Determine status based on action and timestamp
      const timestamp = new Date(record.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
      
      let status: 'completed' | 'pending' | 'overdue' = 'completed';
      if (parsedAction === 'issued' && daysDiff > 7) {
        status = 'overdue';
      } else if (parsedAction === 'requested') {
        status = 'pending';
      }
      
      return {
        id: record.id.toString(),
        timestamp: formatDateTime(record.timestamp),
        memberName: record.full_name || record.username || 'Unknown User',
        memberId: record.roll_number || record.email?.split('@')[0] || `USER-${record.user_id || 'N/A'}`,
        action: parsedAction,
        toolName,
        quantity,
        purpose,
        status
      };
    });
  };

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
    link.download = `activity-report-${formatDate(new Date()).replace(/\//g, '-')}.csv`;
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
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-neutral-500">Loading activity history...</p>
            </div>
          ) : filteredActivities.length > 0 ? (
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalRecords)} of {totalRecords} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-lg border border-neutral-700 text-neutral-400 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-neutral-400 hover:bg-neutral-800'
                      } disabled:opacity-50`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="p-2 rounded-lg border border-neutral-700 text-neutral-400 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
