import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, User, Package, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchRequests, approveRequest, rejectRequest, RequestRecord } from '@/app/lib/api';
import { useAuth } from '@/app/providers/auth-provider';
import { toast } from 'sonner';
import { formatDate } from "@/app/lib/date";

export function MemberRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ pending: 0, approvedToday: 0, rejectedToday: 0 });

  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const allRequests = await fetchRequests(token);
      setRequests(allRequests);
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const pending = allRequests.filter(r => r.status === 'pending').length;
      const approvedToday = allRequests.filter(r => 
        r.status === 'approved' && r.resolved_at?.startsWith(today)
      ).length;
      const rejectedToday = allRequests.filter(r => 
        r.status === 'rejected' && r.resolved_at?.startsWith(today)
      ).length;
      setStats({ pending, approvedToday, rejectedToday });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (requestId: number) => {
    if (!token) return;
    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      await approveRequest(token, requestId);
      toast.success('Request approved successfully');
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleReject = async (requestId: number) => {
    if (!token) return;
    const reason = window.prompt('Enter rejection reason (optional):');
    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      await rejectRequest(token, requestId, reason || undefined);
      toast.success('Request rejected');
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-neutral-800 text-neutral-300';
      default:
        return 'bg-orange-500/20 text-orange-400';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Member Requests</h2>
          <p className="text-neutral-500 mt-1">Review and approve tool requests from lab members</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Pending</p>
              <p className="text-2xl font-semibold text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Approved Today</p>
              <p className="text-2xl font-semibold text-white">{stats.approvedToday}</p>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Rejected Today</p>
              <p className="text-2xl font-semibold text-white">{stats.rejectedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && requests.length === 0 && (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-500">Loading requests...</p>
        </div>
      )}

      {/* Pending Requests List */}
      {!loading && pendingRequests.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-neutral-500">No pending requests at the moment.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Pending Requests ({pendingRequests.length})</h3>
          </div>
          <div className="divide-y divide-neutral-800">
            {pendingRequests.map((request) => {
              const isProcessing = processingIds.has(request.id);
              return (
                <div key={request.id} className="p-6 hover:bg-neutral-800 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center">
                            <User className="w-6 h-6 text-neutral-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-base font-semibold text-white">
                              {request.requester_name || request.username || `User #${request.user_id}`}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 mb-2">{request.title}</p>
                          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
                            <Package className="w-4 h-4" />
                            <span className="font-medium">{request.tool_name}</span>
                            <span className="text-neutral-400">×</span>
                            <span>{request.quantity}</span>
                          </div>
                          {request.reason && (
                            <p className="text-sm text-neutral-400">
                              <span className="font-medium">Reason:</span> {request.reason}
                            </p>
                          )}
                          {request.expected_return_date && (
                            <p className="text-sm text-neutral-400">
                              <span className="font-medium">Expected Return:</span> {formatDate(request.expected_return_date)}
                            </p>
                          )}
                          <p className="text-xs text-neutral-400 mt-2">
                            Requested on {formatDate(request.requested_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing}
                        className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={isProcessing}
                        className="flex-1 lg:flex-none px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Resolved Requests */}
      {requests.filter(r => r.status !== 'pending').length > 0 && (
        <div className="mt-6 bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Recently Resolved</h3>
          </div>
          <div className="divide-y divide-neutral-800">
            {requests
              .filter(r => r.status !== 'pending')
              .slice(0, 10)
              .map((request) => (
                <div key={request.id} className="p-4 hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {request.requester_name || request.username || `User #${request.user_id}`}
                        </p>
                        <p className="text-sm text-neutral-500">{request.tool_name} × {request.quantity}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
