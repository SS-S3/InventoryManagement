import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/app/lib/date";
import { Loader, Trophy, Briefcase } from "lucide-react";
import { useAuthStore } from "@/app/stores/auth-store";
import { fetchProjects, fetchCompetitions, fetchMyApplications, volunteerForProject, volunteerForCompetition, ProjectRecord, CompetitionRecord, MyApplications } from "@/app/lib/api";

export function Opportunities() {
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplications | null>(null);
  const [volunteeringFor, setVolunteeringFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOpportunities = useCallback(async () => {
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
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadOpportunities();
    }
  }, [token, loadOpportunities]);

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
    if (projectId !== undefined) {
      const app = myApplications?.projects.find(p => p.project_id === projectId);
      return app?.status;
    }
    if (competitionId !== undefined) {
      const app = myApplications?.competitions.find(c => c.competition_id === competitionId);
      return app?.status;
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Opportunities</h2>
        <p className="text-neutral-400 mt-1">
          Explore and apply for available projects and competitions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Projects Column */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            Projects
          </h3>
          {projects.length === 0 ? (
            <p className="text-neutral-500">No projects available.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const applied = hasAppliedToProject(project.id);
                const status = getApplicationStatus(project.id);
                const isVolunteering = volunteeringFor === `project-${project.id}`;

                return (
                  <div key={project.id} className="p-5 border border-neutral-800 rounded-lg bg-neutral-950/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-lg text-white">{project.name}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                        project.status === "active" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    {project.lead_name && (
                      <p className="text-sm text-neutral-500 mb-2">Lead: {project.lead_name}</p>
                    )}
                    <p className="text-neutral-400 text-sm mb-4">{project.description}</p>
                    
                    {applied ? (
                      <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full ${
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
                        className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isVolunteering ? "Applying..." : "Volunteer for Project"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Competitions Column */}
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Competitions
          </h3>
          {competitions.length === 0 ? (
            <p className="text-neutral-500">No competitions available.</p>
          ) : (
            <div className="space-y-4">
              {competitions.map((competition) => {
                const applied = hasAppliedToCompetition(competition.id);
                const status = getApplicationStatus(undefined, competition.id);
                const isVolunteering = volunteeringFor === `competition-${competition.id}`;

                return (
                  <div key={competition.id} className="p-5 border border-neutral-800 rounded-lg bg-neutral-950/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-lg text-white">{competition.name}</h4>
                    </div>
                    {competition.start_date && (
                      <p className="text-sm text-neutral-500 mb-2">
                        Starts: {formatDate(competition.start_date)}
                      </p>
                    )}
                    <p className="text-neutral-400 text-sm mb-4">{competition.description}</p>

                    {applied ? (
                      <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full ${
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
                        className="px-4 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isVolunteering ? "Applying..." : "Volunteer for Competition"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
