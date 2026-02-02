import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import { Trophy, Plus, ChevronDown, Loader, Calendar, Users, CheckCircle, XCircle } from "lucide-react";
import { 
  CompetitionRecord, 
  fetchCompetitions, 
  fetchCompetitionItems, 
  createCompetition,
  fetchCompetitionVolunteers,
  resolveCompetitionVolunteer,
  VolunteerRecord
} from "@/app/lib/api";
import { useAuth } from "@/app/providers/auth-provider";

interface CompetitionItem {
  id: number;
  competition_id: number;
  item_id: number;
  quantity: number;
  item_name: string;
}

type CompetitionData = CompetitionRecord;

export function Competitions() {
  const { token, user } = useAuth();
  const [competitions, setCompetitions] = useState<CompetitionData[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [competitionItems, setCompetitionItems] = useState<Record<number, CompetitionItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompetition, setNewCompetition] = useState({
    name: "",
    start_date: "",
    description: "",
  });
  const [creating, setCreating] = useState(false);
  const [itemsLoading, setItemsLoading] = useState<Record<number, boolean>>({});
  const [volunteers, setVolunteers] = useState<Record<number, VolunteerRecord[]>>({});
  const [volunteersLoading, setVolunteersLoading] = useState<Record<number, boolean>>({});
  const [processingVolunteer, setProcessingVolunteer] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  const loadCompetitions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompetitions(token);
      setCompetitions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load competitions");
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitionItems = async (competitionId: number) => {
    if (!token || competitionItems[competitionId] || itemsLoading[competitionId]) return;
    setItemsLoading((prev) => ({ ...prev, [competitionId]: true }));
    try {
      const data = await fetchCompetitionItems(token, competitionId);
      setCompetitionItems((prev) => ({ ...prev, [competitionId]: data }));
    } catch (err) {
      console.error("Failed to load competition items", err);
    } finally {
      setItemsLoading((prev) => ({ ...prev, [competitionId]: false }));
    }
  };

  const loadCompetitionVolunteers = async (competitionId: number) => {
    if (!token || volunteersLoading[competitionId]) return;
    setVolunteersLoading((prev) => ({ ...prev, [competitionId]: true }));
    try {
      const data = await fetchCompetitionVolunteers(token, competitionId);
      setVolunteers((prev) => ({ ...prev, [competitionId]: data }));
    } catch (err) {
      console.error("Failed to load competition volunteers", err);
    } finally {
      setVolunteersLoading((prev) => ({ ...prev, [competitionId]: false }));
    }
  };

  // Force reload volunteers (bypasses loading check)
  const loadCompetitionVolunteersForce = async (competitionId: number) => {
    if (!token) return;
    try {
      const data = await fetchCompetitionVolunteers(token, competitionId);
      setVolunteers((prev) => ({ ...prev, [competitionId]: data }));
    } catch (err) {
      console.error("Failed to load competition volunteers", err);
    }
  };

  // Count pending volunteers for a competition
  const getPendingCount = (competitionId: number): number => {
    const competitionVolunteers = volunteers[competitionId];
    if (!competitionVolunteers) return 0;
    return competitionVolunteers.filter(v => v.status === "pending").length;
  };

  const handleResolveVolunteer = useCallback(async (competitionId: number, volunteerId: number, status: "accepted" | "rejected") => {
    if (!token) return;
    setProcessingVolunteer(volunteerId);
    try {
      await resolveCompetitionVolunteer(token, competitionId, volunteerId, status);
      // Reload volunteers to update the count
      await loadCompetitionVolunteersForce(competitionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve volunteer");
    } finally {
      setProcessingVolunteer(null);
    }
  }, [token]);

  useEffect(() => {
    loadCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load volunteers for all competitions on initial load to show notification counts
  useEffect(() => {
    if (token && isAdmin && competitions.length > 0) {
      competitions.forEach(competition => {
        if (!volunteers[competition.id]) {
          loadCompetitionVolunteers(competition.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin, competitions.length]);

  const handleToggleCompetition = useCallback((competitionId: number) => {
    setError(null);
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(competitionId)) {
        next.delete(competitionId);
      } else {
        next.add(competitionId);
        loadCompetitionItems(competitionId);
        if (isAdmin) {
          loadCompetitionVolunteers(competitionId);
        }
      }
      return next;
    });
  }, [isAdmin]);

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCompetition.name.trim()) {
      setError("Please enter a competition name");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const payload = {
        name: newCompetition.name.trim(),
        description: newCompetition.description.trim(),
        start_date: newCompetition.start_date || undefined,
      };
      const response = await createCompetition(token, payload);
      const createdCompetition: CompetitionData = {
        id: response.id,
        ...payload,
      };
      setCompetitions((prev) => [createdCompetition, ...prev]);
      setNewCompetition({ name: "", start_date: "", description: "" });
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create competition");
    } finally {
      setCreating(false);
    }
  };

  if (!token) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-200">Competitions</h2>
        <p className="text-gray-400 mt-3">Please sign in to view competitions.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-black to-neutral-950 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-500" />
          Competitions
        </h2>
        <p className="text-neutral-400 mt-2">
          View and manage competitions with allocated tools and resources
        </p>
      </div>

      {isAdmin && (
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Competition
        </button>
      )}

      {showCreateForm && isAdmin && (
        <div className="mb-6 bg-neutral-900 border border-neutral-700 rounded-lg p-6 space-y-4">
          <form onSubmit={handleCreateCompetition} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Name</label>
              <input
                type="text"
                value={newCompetition.name}
                onChange={(e) => setNewCompetition({ ...newCompetition, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Competition name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="date"
                  value={newCompetition.start_date}
                  onChange={(e) => setNewCompetition({ ...newCompetition, start_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-400 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
              <textarea
                value={newCompetition.description}
                onChange={(e) =>
                  setNewCompetition({ ...newCompetition, description: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                placeholder="Competition description"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                aria-busy={creating}
                className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && !competitions.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-violet-500 animate-spin mr-3" />
          <p className="text-neutral-400">Loading competitions...</p>
        </div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/50 rounded-lg border border-neutral-700">
          <Trophy className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">No competitions available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {competitions.map((competition) => {
            const items = competitionItems[competition.id] || [];
            const isOpen = expandedIds.has(competition.id);
            const isLoadingItems = !!itemsLoading[competition.id] && items.length === 0;
            const competitionVolunteers = volunteers[competition.id] || [];
            const isLoadingVolunteers = !!volunteersLoading[competition.id];

            return (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                isOpen={isOpen}
                onToggle={handleToggleCompetition}
                competitionId={competition.id}
                items={items}
                isLoadingItems={isLoadingItems}
                volunteers={competitionVolunteers}
                isLoadingVolunteers={isLoadingVolunteers}
                onResolveVolunteer={handleResolveVolunteer}
                processingVolunteer={processingVolunteer}
                isAdmin={isAdmin}
                pendingCount={getPendingCount(competition.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CompetitionCardProps {
  competition: CompetitionData;
  competitionId: number;
  isOpen: boolean;
  onToggle: (id: number) => void;
  items: CompetitionItem[];
  isLoadingItems: boolean;
  volunteers: VolunteerRecord[];
  isLoadingVolunteers: boolean;
  onResolveVolunteer: (competitionId: number, volunteerId: number, status: "accepted" | "rejected") => void;
  processingVolunteer: number | null;
  isAdmin: boolean;
  pendingCount: number;
}

const CompetitionCard = memo(function CompetitionCard({
  competition,
  competitionId,
  isOpen,
  onToggle,
  items,
  isLoadingItems,
  volunteers,
  isLoadingVolunteers,
  onResolveVolunteer,
  processingVolunteer,
  isAdmin,
  pendingCount,
}: CompetitionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    onToggle(competitionId);
  }, [onToggle, competitionId]);

  const formattedDate = useMemo(() => {
    const candidate = competition.start_date || competition.end_date;
    if (!candidate) return null;
    const date = new Date(candidate);
    if (Number.isNaN(date.getTime())) return candidate;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [competition.end_date, competition.start_date]);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-3xl transition-all duration-300 ease-out ${
        isOpen
          ? "ring-2 ring-violet-500/60 bg-neutral-900 shadow-[0_20px_60px_-30px_rgba(139,92,246,0.7)]"
          : "ring-1 ring-neutral-800 bg-neutral-900/60 hover:ring-neutral-700"
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full text-left px-6 py-6 flex items-start gap-4"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{competition.name}</h3>
            {pendingCount > 0 && isAdmin && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
            {formattedDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-400 line-clamp-3">{competition.description}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition-transform ${
            isOpen ? "rotate-180 border-violet-500 text-violet-300" : ""
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[800px]" : "max-h-0"
        }`}
      >
        <div className="px-6 pb-6 space-y-4">
          {/* Allocated Items Section */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 shadow-inner">
            <h4 className="text-sm font-semibold text-neutral-200 mb-4">Allocated Items</h4>

            {isLoadingItems ? (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                Fetching allocation details...
              </div>
            ) : items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${competition.id}-${item.item_id}`}
                    className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-800/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.item_name}</p>
                      <p className="text-xs text-neutral-400 mt-1">Quantity: {item.quantity}</p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300">
                      ✓ Allocated
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No items allocated yet</p>
            )}
          </div>

          {/* Volunteer Applications Section (Admin Only) */}
          {isAdmin && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 shadow-inner">
              <h4 className="text-sm font-semibold text-neutral-200 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Volunteer Applications
              </h4>

              {isLoadingVolunteers ? (
                <div className="flex items-center gap-2 text-neutral-400 text-sm">
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading volunteers...
                </div>
              ) : volunteers.length > 0 ? (
                <div className="space-y-3">
                  {volunteers.map((vol) => (
                    <div
                      key={vol.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-800/40 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{vol.full_name}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {vol.email} • {vol.department || "No dept"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {vol.status === "pending" ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolveVolunteer(competitionId, vol.id, "accepted");
                              }}
                              disabled={processingVolunteer === vol.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-60 text-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onResolveVolunteer(competitionId, vol.id, "rejected");
                              }}
                              disabled={processingVolunteer === vol.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-60 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                              vol.status === "accepted"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {vol.status === "accepted" ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {vol.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No volunteer applications yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
