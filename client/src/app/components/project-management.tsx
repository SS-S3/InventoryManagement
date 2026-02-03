import { useEffect, useState } from "react";
import { formatDate } from "@/app/lib/date";
import { Plus, Users, Calendar, Loader, CheckCircle, XCircle, Clock, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";
import { 
  fetchProjects, 
  createProject, 
  updateProject,
  fetchProjectVolunteers,
  resolveProjectVolunteer,
  fetchAllUsers,
  ProjectRecord, 
  VolunteerRecord,
  AuthUserResponse
} from "@/app/lib/api";

export function ProjectManagement() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [allUsers, setAllUsers] = useState<AuthUserResponse[]>([]);
  const [volunteers, setVolunteers] = useState<Record<number, VolunteerRecord[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [processingVolunteer, setProcessingVolunteer] = useState<number | null>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    lead_id: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (token) {
      loadProjects();
      loadUsers();
    }
  }, [token]);

  const loadProjects = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchProjects(token);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      const data = await fetchAllUsers(token);
      setAllUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const loadVolunteers = async (projectId: number) => {
    if (!token) return;
    try {
      const data = await fetchProjectVolunteers(token, projectId);
      setVolunteers(prev => ({ ...prev, [projectId]: data }));
    } catch (err) {
      console.error("Failed to load volunteers", err);
    }
  };

  const handleToggleExpand = (projectId: number) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      // Always reload volunteers when expanding to get latest data
      loadVolunteers(projectId);
    }
  };

  // Load volunteers for all projects on initial load to show notification counts
  useEffect(() => {
    if (token && projects.length > 0) {
      projects.forEach(project => {
        if (!volunteers[project.id]) {
          loadVolunteers(project.id);
        }
      });
    }
  }, [token, projects.length]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newProject.name) return;

    setIsLoading(true);
    try {
      await createProject(token, {
        name: newProject.name,
        description: newProject.description || undefined,
        lead_id: newProject.lead_id ? parseInt(newProject.lead_id) : undefined,
        start_date: newProject.start_date || undefined,
        end_date: newProject.end_date || undefined,
      });
      setNewProject({ name: "", description: "", lead_id: "", start_date: "", end_date: "" });
      setShowCreateForm(false);
      loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (projectId: number, status: string) => {
    if (!token) return;
    try {
      await updateProject(token, projectId, { status });
      loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    }
  };

  const handleResolveVolunteer = async (projectId: number, volunteerId: number, status: "accepted" | "rejected") => {
    if (!token) return;
    setProcessingVolunteer(volunteerId);
    try {
      await resolveProjectVolunteer(token, projectId, volunteerId, status);
      await loadVolunteers(projectId);
      // Refresh projects to update volunteer count
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve volunteer");
    } finally {
      setProcessingVolunteer(null);
    }
  };

  // Count pending volunteers for a project
  const getPendingCount = (projectId: number): number => {
    const projectVolunteers = volunteers[projectId];
    if (!projectVolunteers) return 0;
    return projectVolunteers.filter(v => v.status === "pending").length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-500/20 text-blue-400";
      case "active": return "bg-green-500/20 text-green-400";
      case "completed": return "bg-purple-500/20 text-purple-400";
      case "on_hold": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-neutral-500/20 text-neutral-400";
    }
  };

  if (!token || user?.role !== "admin") {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-200">Access Denied</h2>
        <p className="text-gray-400 mt-3">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-black to-neutral-950 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-violet-500" />
            Project Management
          </h2>
          <p className="text-neutral-400 mt-2">
            Manage projects, assign leads, and review volunteer applications
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-white">×</button>
        </div>
      )}

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Project Name *</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Project Lead</label>
                <select
                  value={newProject.lead_id}
                  onChange={e => setNewProject({ ...newProject, lead_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select Lead</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
              <textarea
                value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={3}
                placeholder="Project description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newProject.start_date}
                  onChange={e => setNewProject({ ...newProject, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={newProject.end_date}
                  onChange={e => setNewProject({ ...newProject, end_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-60"
              >
                {isLoading ? "Creating..." : "Create Project"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      {isLoading && !projects.length ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-400">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/50 rounded-lg border border-neutral-700">
          <Briefcase className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">No projects yet. Create your first project!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(project => (
            <div key={project.id} className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      {getPendingCount(project.id) > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                          {getPendingCount(project.id)}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {project.lead_name && (
                        <span className="flex items-center gap-1 text-neutral-300">
                          <Users className="w-4 h-4 text-violet-500" />
                          Lead: {project.lead_name}
                        </span>
                      )}
                      {project.start_date && (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : "Ongoing"}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-neutral-400">
                        <Users className="w-4 h-4" />
                        {project.volunteer_count || 0} volunteers
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={project.status}
                      onChange={e => handleUpdateStatus(project.id, e.target.value)}
                      className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleToggleExpand(project.id)}
                      className="p-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      {expandedProject === project.id ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Volunteers Section */}
              {expandedProject === project.id && (
                <div className="border-t border-neutral-800 p-6 bg-neutral-950/50">
                  <h4 className="text-sm font-semibold text-neutral-300 mb-4">Volunteer Applications</h4>
                  {!volunteers[project.id] ? (
                    <div className="flex items-center gap-2 text-neutral-400 text-sm">
                      <Loader className="w-4 h-4 animate-spin" />
                      Loading volunteers...
                    </div>
                  ) : volunteers[project.id].length === 0 ? (
                    <p className="text-neutral-500 text-sm">No volunteer applications yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {volunteers[project.id].map(vol => (
                        <div key={vol.id} className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{vol.full_name}</p>
                            <p className="text-neutral-400 text-sm">{vol.email} • {vol.department || "No dept"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {vol.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleResolveVolunteer(project.id, vol.id, "accepted")}
                                  disabled={processingVolunteer === vol.id}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-60"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleResolveVolunteer(project.id, vol.id, "rejected")}
                                  disabled={processingVolunteer === vol.id}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-60"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                                vol.status === "accepted" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                              }`}>
                                {vol.status === "accepted" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {vol.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
