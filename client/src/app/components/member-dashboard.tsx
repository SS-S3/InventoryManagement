import { useEffect, useState } from "react";
import { formatDate } from "@/app/lib/date";
import { Package, Clock, CheckCircle, AlertCircle, Loader, ExternalLink, RefreshCw, Newspaper, Trophy, Briefcase, Hand } from "lucide-react";
import { useAuthStore } from "@/app/stores/auth-store";
import { useDashboardStore } from "@/app/stores/dashboard-store";
import { useBorrowingsStore } from "@/app/stores/borrowings-store";
import { useRequestsStore } from "@/app/stores/requests-store";
import { useArticlesStore } from "@/app/stores/articles-store";
import { fetchProjects, fetchCompetitions, fetchMyApplications, volunteerForProject, volunteerForCompetition, ProjectRecord, CompetitionRecord, MyApplications } from "@/app/lib/api";

interface MemberDashboardProps {
  onNavigate: (page: string) => void;
}

export function MemberDashboard({ onNavigate }: MemberDashboardProps) {
  const { token, user } = useAuthStore();
  const { summary, fetchSummary, isLoading: dashboardLoading } = useDashboardStore();
  const { records: borrowings, fetchBorrowings, returnBorrowing, isLoading: borrowingsLoading } = useBorrowingsStore();
  const { records: requests, fetchRequests, cancelRequest, isLoading: requestsLoading } = useRequestsStore();
  const { articles, fetchedFor, fetchArticles, refreshArticles, isLoading: articlesLoading, isRefreshing } = useArticlesStore();
  
  const [returningId, setReturningId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplications | null>(null);
  const [volunteeringFor, setVolunteeringFor] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSummary(token).catch(() => {});
      fetchBorrowings(token).catch(() => {});
      fetchRequests(token, "pending").catch(() => {});
      fetchArticles(token).catch(() => {});
      loadOpportunities();
    }
  }, [token, fetchSummary, fetchBorrowings, fetchRequests, fetchArticles]);

  const loadOpportunities = async () => {
    if (!token) return;
    try {
      const [projectsData, competitionsData, applicationsData] = await Promise.all([
        fetchProjects(token),
        fetchCompetitions(token),
        fetchMyApplications(token)
      ]);
      setProjects(projectsData.filter(p => p.status === "active" || p.status === "planning"));
      setCompetitions(competitionsData.filter(c => c.status === "upcoming" || c.status === "active"));
      setMyApplications(applicationsData);
    } catch (error) {
      console.error("Failed to load opportunities", error);
    }
  };

  const activeBorrowings = borrowings.filter((b) => !b.returned_at);
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const completedReturns = borrowings.filter((b) => b.returned_at).length;

  const overdueBorrowings = activeBorrowings.filter((b) => {
    if (!b.expected_return_date) return false;
    return new Date(b.expected_return_date) < new Date();
  });

  const stats = [
    {
      id: 1,
      title: "Active Tools",
      value: String(activeBorrowings.length),
      icon: Package,
      color: "bg-blue-500",
      change: activeBorrowings.length + " borrowed",
    },
    {
      id: 2,
      title: "Pending Requests",
      value: String(pendingRequests.length),
      icon: Clock,
      color: "bg-orange-500",
      change: "Awaiting approval",
    },
    {
      id: 3,
      title: "Completed",
      value: String(completedReturns),
      icon: CheckCircle,
      color: "bg-green-500",
      change: "Total returns",
    },
    {
      id: 4,
      title: "Overdue",
      value: String(overdueBorrowings.length),
      icon: AlertCircle,
      color: overdueBorrowings.length > 0 ? "bg-red-500" : "bg-green-500",
      change: overdueBorrowings.length > 0 ? "Action required" : "No overdue items",
    },
  ];

  const getDaysLeft = (dueDate: string | null | undefined): number | null => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleReturn = async (borrowingId: number) => {
    if (!token) return;
    setReturningId(borrowingId);
    try {
      await returnBorrowing(token, borrowingId);
    } catch (error) {
      console.error("Failed to return borrowing", error);
    } finally {
      setReturningId(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!token) return;
    setCancellingId(requestId);
    try {
      await cancelRequest(token, requestId);
    } catch (error) {
      console.error("Failed to cancel request", error);
    } finally {
      setCancellingId(null);
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

  const handleVolunteerProject = async (projectId: number) => {
    if (!token) return;
    setVolunteeringFor(`project-${projectId}`);
    try {
      await volunteerForProject(token, projectId);
      await loadOpportunities();
    } catch (error) {
      console.error("Failed to volunteer for project", error);
    } finally {
      setVolunteeringFor(null);
    }
  };

  const handleVolunteerCompetition = async (competitionId: number) => {
    if (!token) return;
    setVolunteeringFor(`competition-${competitionId}`);
    try {
      await volunteerForCompetition(token, competitionId);
      await loadOpportunities();
    } catch (error) {
      console.error("Failed to volunteer for competition", error);
    } finally {
      setVolunteeringFor(null);
    }
  };

  const hasAppliedToProject = (projectId: number) => {
    return myApplications?.projects.some(p => p.project_id === projectId);
  };

  const hasAppliedToCompetition = (competitionId: number) => {
    return myApplications?.competitions.some(c => c.competition_id === competitionId);
  };

  const getApplicationStatus = (projectId?: number, competitionId?: number) => {
    if (projectId) {
      const app = myApplications?.projects.find(p => p.project_id === projectId);
      return app?.status;
    }
    if (competitionId) {
      const app = myApplications?.competitions.find(c => c.competition_id === competitionId);
      return app?.status;
    }
    return undefined;
  };

  const isLoading = dashboardLoading || borrowingsLoading || requestsLoading;

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
        <h2 className="text-2xl font-semibold text-white">My Dashboard</h2>
        <p className="text-neutral-400 mt-1">
          Welcome back, {user?.full_name || user?.username}! Track your tools and requests.
        </p>
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
        {/* Active Tools */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Active Tools</h3>
            <p className="text-sm text-neutral-400 mt-1">Tools currently in your possession</p>
          </div>
          <div className="p-6">
            {activeBorrowings.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No active borrowings</p>
            ) : (
              <div className="space-y-4">
                {activeBorrowings.slice(0, 5).map((borrowing) => {
                  const daysLeft = getDaysLeft(borrowing.expected_return_date);
                  const isOverdue = daysLeft !== null && daysLeft < 0;
                  return (
                    <div
                      key={borrowing.id}
                      className="p-4 border border-neutral-800 rounded-lg hover:border-violet-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">{borrowing.tool_name}</h4>
                        {daysLeft !== null && (
                          <span
                            className={"text-xs font-medium px-2 py-1 rounded " + (
                              isOverdue
                                ? "bg-red-500/20 text-red-400"
                                : daysLeft <= 3
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-green-500/20 text-green-400"
                            )}
                          >
                            {isOverdue ? Math.abs(daysLeft) + " days overdue" : daysLeft + " days left"}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-400 space-y-1">
                        <p>Borrowed: {formatDate(borrowing.borrowed_at)}</p>
                        {borrowing.expected_return_date && (
                          <p>Due: {formatDate(borrowing.expected_return_date)}</p>
                        )}
                        {borrowing.quantity > 1 && <p>Quantity: {borrowing.quantity}</p>}
                      </div>
                      <button
                        onClick={() => handleReturn(borrowing.id)}
                        disabled={returningId === borrowing.id}
                        className="mt-3 text-sm text-violet-400 hover:text-violet-300 font-medium disabled:opacity-50"
                      >
                        {returningId === borrowing.id ? "Returning..." : "Return Tool"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
            <p className="text-sm text-neutral-400 mt-1">Awaiting admin approval</p>
          </div>
          <div className="p-6">
            {pendingRequests.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-neutral-800 rounded-lg hover:border-orange-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-white">{request.title}</h4>
                        <p className="text-sm text-neutral-400">{request.tool_name}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                        Pending
                      </span>
                    </div>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <p>Requested: {formatDate(request.requested_at)}</p>
                      {request.quantity > 1 && <p>Quantity: {request.quantity}</p>}
                    </div>
                    <button
                      onClick={() => handleCancel(request.id)}
                      disabled={cancellingId === request.id}
                      className="mt-3 text-sm text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                    >
                      {cancellingId === request.id ? "Cancelling..." : "Cancel Request"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate("request-tool")}
            className="p-4 border-2 border-violet-500/30 rounded-lg hover:bg-violet-500/10 transition-colors text-left group"
          >
            <Package className="w-8 h-8 text-violet-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Request Tool</h4>
            <p className="text-sm text-neutral-400">Request a new tool from inventory</p>
          </button>
          <button
            onClick={() => onNavigate("weekly-tasks")}
            className="p-4 border-2 border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors text-left group"
          >
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Weekly Tasks</h4>
            <p className="text-sm text-neutral-400">View and submit assignments</p>
          </button>
          <button
            onClick={() => onNavigate("request-history")}
            className="p-4 border-2 border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors text-left group"
          >
            <Clock className="w-8 h-8 text-purple-400 mb-2" />
            <h4 className="font-medium text-white mb-1">View History</h4>
            <p className="text-sm text-neutral-400">See all your tool requests</p>
          </button>
        </div>
      </div>

      {/* Project & Competition Opportunities */}
      {(projects.length > 0 || competitions.length > 0) && (
        <div className="mt-6 bg-neutral-900 rounded-xl border border-neutral-800">
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <Hand className="w-5 h-5 text-violet-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Volunteer Opportunities</h3>
                <p className="text-sm text-neutral-400">Join projects and competitions</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Projects */}
              {projects.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    Active Projects
                  </h4>
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((project) => {
                      const applied = hasAppliedToProject(project.id);
                      const status = getApplicationStatus(project.id);
                      const isVolunteering = volunteeringFor === `project-${project.id}`;
                      
                      return (
                        <div key={project.id} className="p-4 border border-neutral-800 rounded-lg hover:border-blue-500/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-white">{project.name}</h5>
                              {project.lead_name && (
                                <p className="text-xs text-neutral-500">Lead: {project.lead_name}</p>
                              )}
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                              project.status === "active" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{project.description}</p>
                          {applied ? (
                            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                              status === "accepted" ? "bg-green-500/20 text-green-400" :
                              status === "rejected" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {status === "accepted" ? "✓ Accepted" : status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVolunteerProject(project.id)}
                              disabled={isVolunteering}
                              className="text-sm text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
                            >
                              {isVolunteering ? "Applying..." : "Volunteer →"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Competitions */}
              {competitions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Upcoming Competitions
                  </h4>
                  <div className="space-y-3">
                    {competitions.slice(0, 3).map((competition) => {
                      const applied = hasAppliedToCompetition(competition.id);
                      const status = getApplicationStatus(undefined, competition.id);
                      const isVolunteering = volunteeringFor === `competition-${competition.id}`;
                      
                      return (
                        <div key={competition.id} className="p-4 border border-neutral-800 rounded-lg hover:border-yellow-500/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white">{competition.name}</h5>
                            {competition.start_date && (
                              <span className="text-xs text-neutral-500">
                                {formatDate(competition.start_date)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{competition.description}</p>
                          {applied ? (
                            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                              status === "accepted" ? "bg-green-500/20 text-green-400" :
                              status === "rejected" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {status === "accepted" ? "✓ Accepted" : status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVolunteerCompetition(competition.id)}
                              disabled={isVolunteering}
                              className="text-sm text-yellow-400 hover:text-yellow-300 font-medium disabled:opacity-50"
                            >
                              {isVolunteering ? "Applying..." : "Volunteer →"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Robotics Articles Panel */}
      <div className="mt-6 bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="w-5 h-5 text-violet-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Latest Robotics News</h3>
              {fetchedFor && (
                <p className="text-xs text-neutral-500">Last updated: {fetchedFor}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleRefreshArticles}
            disabled={isRefreshing}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh articles"
          >
            <RefreshCw className={"w-5 h-5 " + (isRefreshing ? "animate-spin" : "")} />
          </button>
        </div>
        <div className="p-6">
          {articlesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              No articles available. Click refresh to fetch latest news.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.slice(0, 6).map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border border-neutral-800 rounded-lg hover:border-violet-500/50 hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-violet-300">
                      {article.title}
                    </h4>
                    <ExternalLink className="w-4 h-4 text-neutral-500 flex-shrink-0 group-hover:text-violet-400" />
                  </div>
                  {article.source && (
                    <p className="text-xs text-neutral-500 mt-2">{article.source}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
