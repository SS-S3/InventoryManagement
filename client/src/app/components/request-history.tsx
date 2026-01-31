import { Search, Filter, Calendar, Package, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { fetchRequests, RequestRecord } from '@/app/lib/api';
import { useAuth } from '@/app/providers/auth-provider';

export function RequestHistory() {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const allRequests = await fetchRequests(token);
      // Filter to only show current user's requests (for members)
      const userRequests = user?.role === 'member' 
        ? allRequests.filter(r => r.user_id === user.id)
        : allRequests;
      setRequests(userRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.tool_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-neutral-800 text-neutral-300 border-neutral-800';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-800';
    }
  };

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    cancelled: requests.filter((r) => r.status === 'cancelled').length,
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Request History</h2>
          <p className="text-neutral-500 mt-1">View and track all your tool requests</p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by tool name or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-neutral-900 appearance-none cursor-pointer"
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="approved">Approved ({statusCounts.approved})</option>
                <option value="rejected">Rejected ({statusCounts.rejected})</option>
                <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && requests.length === 0 && (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading requests...</p>
        </div>
      )}

      {/* Requests Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{request.tool_name}</h3>
                    <p className="text-sm text-neutral-500">{request.title}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm border-t border-neutral-800 pt-4">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Package className="w-4 h-4" />
                    <span>Quantity: {request.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Calendar className="w-4 h-4" />
                    <span>Requested: {formatDate(request.requested_at)}</span>
                  </div>
                  {request.expected_return_date && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Calendar className="w-4 h-4" />
                      <span>Return by: {formatDate(request.expected_return_date)}</span>
                    </div>
                  )}
                </div>

                {/* Reason */}
                {request.reason && (
                  <p className="mt-3 text-sm text-neutral-400 line-clamp-2">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                )}

                {/* Action Button */}
                <button className="mt-4 w-full py-2 text-sm text-blue-400 hover:text-blue-700 font-medium border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredRequests.length === 0 && (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No requests found</h3>
          <p className="text-neutral-500">
            {requests.length === 0 
              ? "You haven't made any requests yet. Go to Request Tool to submit a new request."
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="bg-neutral-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutral-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Request Details</h3>
                  <p className="text-sm text-neutral-500">Request ID: #{selectedRequest.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-neutral-400 hover:text-neutral-400 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border capitalize ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
              </div>

              {/* Tool Info */}
              <div className="bg-neutral-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Request Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Title:</span>
                    <span className="font-medium text-white">{selectedRequest.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Tool Name:</span>
                    <span className="font-medium text-white">{selectedRequest.tool_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Quantity:</span>
                    <span className="font-medium text-white">{selectedRequest.quantity}</span>
                  </div>
                  {selectedRequest.reason && (
                    <div>
                      <span className="text-neutral-400">Reason:</span>
                      <p className="mt-1 text-white">{selectedRequest.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-neutral-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Requested:</span>
                    <span className="font-medium text-white">{formatDate(selectedRequest.requested_at)}</span>
                  </div>
                  {selectedRequest.expected_return_date && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Expected Return:</span>
                      <span className="font-medium text-white">{formatDate(selectedRequest.expected_return_date)}</span>
                    </div>
                  )}
                  {selectedRequest.resolved_at && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Resolved:</span>
                      <span className="font-medium text-white">{formatDate(selectedRequest.resolved_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.cancellation_reason && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-500/30">
                  <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{selectedRequest.cancellation_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 px-4 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
