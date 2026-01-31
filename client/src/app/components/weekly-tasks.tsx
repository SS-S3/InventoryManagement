import { useEffect, useMemo, useState } from "react";
import { Upload, Github, CheckCircle, XCircle, Clock, Loader, Calendar, Download } from "lucide-react";
import { SubmissionRecord } from "@/app/lib/api";
import { useAuth } from "@/app/providers/auth-provider";
import { useAssignmentsStore } from "@/app/stores/assignments-store";

export function WeeklyTasks() {
  const { token, user } = useAuth();
  const {
    assignments,
    userSubmissions,
    assignmentStats,
    isLoading,
    error,
    fetchAssignments,
    fetchUserSubmissions,
    fetchAssignmentStats,
    fetchSubmissionsForAssignment,
    submitAssignment,
    createAssignment,
    clearError,
  } = useAssignmentsStore();

  const DEPARTMENT_OPTIONS = [
    { value: "mechanical", label: "Mechanical" },
    { value: "software", label: "Software" },
    { value: "embedded", label: "Embedded" },
  ];

  const normalizeDepartment = (dept?: string | null) =>
    dept ? dept.trim().toLowerCase() : "";

  const getDepartmentLabel = (dept?: string | null) => {
    const normalized = normalizeDepartment(dept);
    const match = DEPARTMENT_OPTIONS.find((option) => option.value === normalized);
    return match ? match.label : dept ?? "All Departments";
  };

  const getDefaultAssignmentDepartment = (): "mechanical" | "software" | "embedded" => {
    const normalized = normalizeDepartment(user?.department);
    const match = DEPARTMENT_OPTIONS.find((option) => option.value === normalized);
    return (match ? match.value : DEPARTMENT_OPTIONS[0].value) as "mechanical" | "software" | "embedded";
  };

  const [localError, setLocalError] = useState<string | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "submissions">("assignments");
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
  const [githubLink, setGithubLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState<{
    title: string;
    description: string;
    due_date: string;
    resource_url: string;
    department: "mechanical" | "software" | "embedded";
  }>(() => ({
    title: "",
    description: "",
    due_date: "",
    resource_url: "",
    department: getDefaultAssignmentDepartment(),
  }));

  const isAdmin = user?.role === "admin";
  const userDept = user?.department || "";
  const normalizedUserDept = normalizeDepartment(userDept);
  const departmentLabel = getDepartmentLabel(userDept);
  const showDepartmentWarning = !isAdmin && !normalizedUserDept;
  const visibleError = localError || error;

  const filteredAssignments = useMemo(() => {
    if (!assignments.length) {
      return assignments;
    }
    if (isAdmin || !normalizedUserDept) {
      return assignments;
    }
    return assignments.filter(
      (assignment) => normalizeDepartment(assignment.department) === normalizedUserDept,
    );
  }, [assignments, isAdmin, normalizedUserDept]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        await fetchAssignments(token);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load assignments");
      }
      if (!isAdmin) {
        setSubmissionsLoading(true);
        try {
          await fetchUserSubmissions(token);
        } catch (err) {
          setLocalError((prev) => prev ?? (err instanceof Error ? err.message : "Failed to load submissions"));
        } finally {
          setSubmissionsLoading(false);
        }
      }
    };
    load();
  }, [token, isAdmin, fetchAssignments, fetchUserSubmissions]);

  useEffect(() => {
    if (!token) return;
    assignments
      .filter((assignment) => !assignmentStats[assignment.id])
      .forEach((assignment) => {
        fetchAssignmentStats(token, assignment.id).catch(() => void 0);
      });
  }, [assignments, assignmentStats, fetchAssignmentStats, token]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAssignment || !githubLink.trim()) {
      setLocalError("Please select an assignment and enter a GitHub link");
      return;
    }

    try {
      setSubmitting(true);
      clearError();
      setLocalError(null);
      await submitAssignment(token, selectedAssignment, githubLink.trim());
      setGithubLink("");
      setSelectedAssignment(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newAssignment.title.trim()) {
      setLocalError("Please enter an assignment title");
      return;
    }

    try {
      setSubmitting(true);
      clearError();
      setLocalError(null);
      await createAssignment(token, {
        title: newAssignment.title.trim(),
        description: newAssignment.description.trim() || undefined,
        department: newAssignment.department,
        due_date: newAssignment.due_date || undefined,
        resource_url: newAssignment.resource_url || undefined,
      });
      setNewAssignment({
        title: "",
        description: "",
        due_date: "",
        resource_url: "",
        department: getDefaultAssignmentDepartment(),
      });
      setShowCreateForm(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (submission: SubmissionRecord) => {
    if (!submission.status) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    }
    if (submission.status === "pass") {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" /> Pass
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
        <XCircle className="w-3 h-3" /> Fail
      </span>
    );
  };

  const [exporting, setExporting] = useState<Record<number, boolean>>({});

  const fetchAndPrepareSubmissions = async (assignmentId: number): Promise<SubmissionRecord[]> => {
    if (!token) throw new Error("Not authenticated");
    try {
      setExporting((prev) => ({ ...prev, [assignmentId]: true }));
      await fetchSubmissionsForAssignment(token, assignmentId);
      const latest = useAssignmentsStore.getState().submissionsByAssignment[assignmentId];
      return latest ?? [];
    } finally {
      setExporting((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleDownloadCsv = async (assignmentId: number) => {
    try {
      const subs = await fetchAndPrepareSubmissions(assignmentId);
      if (!subs || subs.length === 0) {
        alert("No submissions for this assignment");
        return;
      }

      const rows = subs.map((s) => ({
        name: s.full_name || s.username || "",
        roll_number: s.roll_number || "",
        department: s.department || "",
        github_link: s.github_link,
        status: s.status || "pending",
        submitted_at: s.submitted_at,
      }));

      const header = ["Name", "Roll Number", "Department", "GitHub Link", "Status", "Submitted At"];
      const csvLines = [header.join(",")];
      for (const r of rows) {
        // escape quotes
        const line = [r.name, r.roll_number, r.department, r.github_link, r.status, r.submitted_at]
          .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
          .join(",");
        csvLines.push(line);
      }

      const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileNameSafe = `assignment_${assignmentId}_submissions.csv`;
      a.download = fileNameSafe;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to export CSV");
    }
  };

  const handlePrint = async (assignmentId: number) => {
    try {
      const subs = await fetchAndPrepareSubmissions(assignmentId);
      const rows = subs.map((s) => ({
        name: s.full_name || s.username || "",
        roll_number: s.roll_number || "",
        department: s.department || "",
        github_link: s.github_link,
        status: s.status || "pending",
        submitted_at: s.submitted_at,
      }));

      const popup = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
      if (!popup) {
        alert("Unable to open print window");
        return;
      }

      const html = `
        <html>
          <head>
            <title>Submissions for assignment ${assignmentId}</title>
            <style>
              body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f3f4f6; }
              a { color: #2563eb; }
            </style>
          </head>
          <body>
            <h2>Submissions for assignment ${assignmentId}</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll Number</th>
                  <th>Department</th>
                  <th>GitHub Link</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (r) => `
                  <tr>
                    <td>${escapeHtml(r.name)}</td>
                    <td>${escapeHtml(r.roll_number)}</td>
                    <td>${escapeHtml(r.department)}</td>
                    <td><a href="${escapeAttr(r.github_link)}" target="_blank">${escapeHtml(r.github_link)}</a></td>
                    <td>${escapeHtml(r.status)}</td>
                    <td>${escapeHtml(r.submitted_at)}</td>
                  </tr>`,
                  )
                  .join("")}
              </tbody>
            </table>
            <script>window.print();</script>
          </body>
        </html>
      `;

      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to prepare print view");
    }
  };

  // small helpers to sanitize output
  const escapeHtml = (s: string | undefined) => (s ? String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "");
  const escapeAttr = (s: string | undefined) => (s ? String(s).replace(/"/g, "%22") : "");

  if (!token) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-200">Weekly Tasks</h2>
        <p className="text-gray-400 mt-3">Please sign in to view tasks.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-black to-neutral-950 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
          Weekly Tasks
        </h2>
        <p className="text-neutral-400 mt-2">
          {isAdmin
            ? "Create assignments and manage submissions"
            : `Submit GitHub links for assignments in your department (${departmentLabel})`}
        </p>
      </div>

      {showDepartmentWarning && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          We could not detect your department. All assignments are shown for now. Please contact an administrator to update your profile details.
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-neutral-700">
        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "assignments"
              ? "border-b-2 border-violet-500 text-violet-400"
              : "text-neutral-400 hover:text-neutral-300"
          }`}
        >
          Assignments
        </button>
        {!isAdmin && (
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "submissions"
                ? "border-b-2 border-violet-500 text-violet-400"
                : "text-neutral-400 hover:text-neutral-300"
            }`}
          >
            My Submissions
          </button>
        )}
      </div>

      {visibleError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {visibleError}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              <Upload className="w-5 h-5" />
              Create Assignment
            </button>
          )}

          {showCreateForm && isAdmin && (
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  📋 Creating assignment for: <strong className="uppercase">{getDepartmentLabel(newAssignment.department)}</strong> department
                </p>
              </div>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Assignment title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    placeholder="Assignment description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Department
                  </label>
                  <select
                    value={newAssignment.department}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, department: e.target.value as "mechanical" | "software" | "embedded" })
                    }
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    {DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Due Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="date"
                        value={newAssignment.due_date}
                        onChange={(e) =>
                          setNewAssignment({ ...newAssignment, due_date: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Resource URL
                    </label>
                    <input
                      type="url"
                      value={newAssignment.resource_url}
                      onChange={(e) =>
                        setNewAssignment({ ...newAssignment, resource_url: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? "Creating..." : "Create Assignment"}
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

          {isLoading && !filteredAssignments.length ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-neutral-400">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <p className="text-neutral-400">
                {normalizedUserDept
                  ? `No assignments available for the ${getDepartmentLabel(userDept)} department`
                  : "No assignments available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                const stats = assignmentStats[assignment.id];
                return (
                  <div
                    key={assignment.id}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 hover:border-neutral-600 transition-all"
                  >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                        <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full capitalize font-medium">
                          {getDepartmentLabel(assignment.department)}
                        </span>
                      </div>
                      {stats ? (
                        <p className="text-xs text-neutral-400">
                          Submissions: <span className="text-neutral-100 font-semibold">{stats.submission_count}</span>
                          {" "}/
                          {stats.assigned_count}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-600">Syncing submission stats…</p>
                      )}
                      <p className="text-sm text-neutral-400 mt-1">{assignment.description}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadCsv(assignment.id)}
                            disabled={!!exporting[assignment.id]}
                            title="Download CSV"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors text-sm"
                          >
                            {exporting[assignment.id] ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            CSV
                          </button>
                          <button
                            onClick={() => handlePrint(assignment.id)}
                            disabled={!!exporting[assignment.id]}
                            title="Print / Save as PDF"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors text-sm"
                          >
                            Print
                          </button>
                        </div>
                      )}
                      {assignment.due_date && (
                        <span className="text-xs text-neutral-500 whitespace-nowrap">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isAdmin && (
                    <>
                      {selectedAssignment === assignment.id ? (
                        <form onSubmit={handleSubmitAssignment} className="mt-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                              <Github className="inline w-4 h-4 mr-2" />
                              GitHub Link
                            </label>
                            <input
                              type="url"
                              value={githubLink}
                              onChange={(e) => setGithubLink(e.target.value)}
                              className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                              placeholder="https://github.com/username/repo"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm"
                            >
                              {submitting ? "Submitting..." : "Submit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssignment(null);
                                setGithubLink("");
                              }}
                              className="flex-1 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-all font-medium text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setSelectedAssignment(assignment.id)}
                          className="mt-4 px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all font-medium flex items-center gap-2"
                        >
                          <Github className="w-4 h-4" />
                          Submit GitHub Link
                        </button>
                      )}
                    </>
                  )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === "submissions" && !isAdmin && (
        <div>
          {submissionsLoading && !userSubmissions.length ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-neutral-400">Loading submissions...</p>
            </div>
          ) : userSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <p className="text-neutral-400">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{submission.title}</h3>
                      <a
                        href={submission.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:text-violet-300 mt-1 flex items-center gap-1 break-all"
                      >
                        <Github className="w-4 h-4 flex-shrink-0" />
                        {submission.github_link}
                      </a>
                    </div>
                    {getStatusBadge(submission)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Submitted</p>
                      <p className="text-neutral-300">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    {submission.graded_at && (
                      <div>
                        <p className="text-neutral-500">Graded</p>
                        <p className="text-neutral-300">
                          {new Date(submission.graded_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {submission.feedback && (
                    <div className="mt-4 p-3 bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-400 mb-1">Feedback:</p>
                      <p className="text-neutral-300 text-sm">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
