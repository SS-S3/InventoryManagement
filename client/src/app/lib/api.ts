// ===========================================
// API Configuration
// ===========================================
// Uses Vite environment variable for the API base URL
// Set VITE_API_BASE in .env.local for development
// Set VITE_API_BASE in Vercel dashboard for production
//
// Development: http://localhost:8080
// Production:  https://your-app-name.onrender.com
// ===========================================
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export type UserRole = "admin" | "member";

export interface AuthUserResponse {
  id: number;
  username: string;
  role: UserRole;
  full_name?: string | null;
  roll_number?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  department?: string | null;
  branch?: string | null;
  is_verified?: number | null;
  created_at?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUserResponse;
}

export interface RegisterPayload {
  username: string;
  password: string;
  full_name?: string;
  roll_number?: string;
  gender?: string;
  phone?: string;
  email?: string;
  department?: "mechanical" | "software" | "embedded";
  branch?: string;
}

export interface BulkRegisterUser {
  full_name: string;
  email: string;
  roll_number?: string;
  gender?: string;
  phone?: string;
  department?: "mechanical" | "software" | "embedded";
  branch?: string;
  password?: string;
}

export interface BulkRegisterResult {
  success: Array<{ email: string; full_name: string; generated_password?: string }>;
  failed: Array<{ email: string; error: string }>;
}

export interface ItemInput {
  name: string;
  description?: string;
  cabinet: string;
  quantity: number;
  location_x?: number | null;
  location_y?: number | null;
}

export interface Item extends ItemInput {
  id: number;
}

export interface Transaction {
  id: number;
  item_id: number;
  user_id: number;
  type: "issue" | "return";
  quantity: number;
  date: string;
  item_name?: string;
  username?: string;
}

export interface RequestRecord {
  id: number;
  user_id: number;
  title: string;
  tool_name: string;
  quantity: number;
  reason?: string | null;
  expected_return_date?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_at: string;
  resolved_at?: string | null;
  resolved_by?: number | null;
  cancellation_reason?: string | null;
  username?: string;
  requester_name?: string;
}

export interface BorrowingRecord {
  id: number;
  user_id: number;
  request_id?: number | null;
  tool_name: string;
  quantity: number;
  borrowed_at: string;
  expected_return_date?: string | null;
  returned_at?: string | null;
  notes?: string | null;
  username?: string;
  borrower_name?: string;
}

export interface AssignmentRecord {
  id: number;
  title: string;
  description?: string | null;
  department: "mechanical" | "software" | "embedded";
  due_date?: string | null;
  resource_url?: string | null;
  created_by: number;
  created_at: string;
}

export interface AssignmentStats {
  assignment_id: number;
  assigned_count: number;
  submission_count: number;
}

export interface SubmissionRecord {
  id: number;
  assignment_id: number;
  user_id: number;
  github_link: string;
  status: "pending" | "pass" | "fail";
  feedback?: string | null;
  submitted_at: string;
  graded_at?: string | null;
  graded_by?: number | null;
  title?: string;
  department?: string;
  due_date?: string;
  username?: string;
  full_name?: string;
  roll_number?: string;
}

export interface CompetitionRecord {
  id: number;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  status?: string | null;
  volunteer_count?: number;
}

export interface ProjectRecord {
  id: number;
  name: string;
  description?: string | null;
  status: "planning" | "active" | "completed" | "on_hold";
  lead_id?: number | null;
  lead_name?: string | null;
  lead_email?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  volunteer_count?: number;
}

export interface VolunteerRecord {
  id: number;
  project_id?: number;
  competition_id?: number;
  user_id: number;
  status: "pending" | "accepted" | "rejected";
  applied_at: string;
  resolved_at?: string | null;
  resolved_by?: number | null;
  full_name?: string;
  email?: string;
  department?: string;
  roll_number?: string;
}

export interface MyApplications {
  projects: Array<VolunteerRecord & { project_name: string; project_description: string; type: "project" }>;
  competitions: Array<VolunteerRecord & { competition_name: string; competition_description: string; type: "competition" }>;
}

export interface DepartmentSubmissionStats {
  department: string;
  total_members: number;
  submitted_members: number;
  submission_percentage: number;
  passed_count: number;
  failed_count: number;
}

export type DepartmentStats = DepartmentSubmissionStats;

export interface HistoryRecord {
  id: number;
  user_id?: number | null;
  username?: string | null;
  action: string;
  details?: string | null;
  timestamp: string;
}

export interface DashboardSummary {
  role: "admin" | "member";
  metrics: Record<string, number>;
  recent: Record<string, unknown>;
}

export interface ArticleRecord {
  id: number;
  title: string;
  url: string;
  source?: string | null;
  published_at?: string | null;
  fetched_for: string;
}

export interface ArticlesResponse {
  fetched_for: string;
  articles: ArticleRecord[];
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { Accept: "application/json" };

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = String(errorBody.error);
      }
    } catch (error) {
      // Ignore JSON parsing errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  if (!text) {
    return undefined as TResponse;
  }

  return JSON.parse(text) as TResponse;
}

export async function fetchProfile(token: string): Promise<AuthUserResponse> {
  return apiRequest<AuthUserResponse>("/profile", { token });
}

export async function loginRequest(username: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/login", {
    method: "POST",
    // backend accepts email OR username in the `email` field for compatibility
    body: { email: username, password },
  });
}

export async function googleLogin(googleIdToken: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/google", {
    method: "POST",
    body: { googleIdToken },
  });
}

export async function registerRequest(payload: RegisterPayload): Promise<{ id: number; message: string }> {
  return apiRequest<Item>("/items", {
    method: "POST",
    body: payload,
    token,
  });
}

// Items & Transactions
export async function fetchItems(token: string): Promise<Item[]> {
  return apiRequest<Item[]>("/items", { token });
}

export async function createItem(token: string, payload: ItemInput): Promise<Item> {
  return apiRequest<Item>("/items", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateItem(token: string, id: number, payload: ItemInput): Promise<Item> {
  return apiRequest<Item>(`/items/${id}`,
    {
      method: "PUT",
      body: payload,
      token,
    }
  );
}

export async function deleteItem(token: string, id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/items/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function issueItem(token: string, payload: { item_id: number; quantity: number }): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/issue", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function fetchTransactions(token: string): Promise<Transaction[]> {
  return apiRequest<Transaction[]>("/transactions", { token });
}

// Requests
export async function fetchRequests(token: string, status?: RequestRecord["status"]): Promise<RequestRecord[]> {
  const query = status ? `?status=${status}` : "";
  return apiRequest<RequestRecord[]>(`/requests${query}`, { token });
}

export async function createRequest(
  token: string,
  payload: { title: string; tool_name: string; quantity?: number; reason?: string; expected_return_date?: string },
): Promise<RequestRecord> {
  return apiRequest<RequestRecord>("/requests", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function approveRequest(token: string, requestId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/requests/${requestId}/approve`, {
    method: "PUT",
    token,
  });
}

export async function rejectRequest(token: string, requestId: number, reason?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/requests/${requestId}/reject`, {
    method: "PUT",
    body: { reason },
    token,
  });
}

export async function cancelRequest(token: string, requestId: number, reason?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/requests/${requestId}/cancel`, {
    method: "PUT",
    body: { reason },
    token,
  });
}

// Borrowings
export async function fetchBorrowings(token: string): Promise<BorrowingRecord[]> {
  return apiRequest<BorrowingRecord[]>("/borrowings", { token });
}

export async function createBorrowing(
  token: string,
  payload: { user_id: number; tool_name: string; quantity?: number; expected_return_date?: string; notes?: string },
): Promise<BorrowingRecord> {
  return apiRequest<BorrowingRecord>("/borrowings", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function returnBorrowing(token: string, borrowingId: number, notes?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/borrowings/${borrowingId}/return`, {
    method: "PUT",
    body: { notes },
    token,
  });
}

// Assignments & Submissions
export async function createAssignment(
  token: string,
  payload: { title: string; description?: string; department: AssignmentRecord["department"]; due_date?: string; resource_url?: string },
): Promise<{ id: number; message: string }> {
  return apiRequest("/assignments", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function fetchAssignments(token: string): Promise<AssignmentRecord[]> {
  return apiRequest<AssignmentRecord[]>("/assignments", { token });
}

export async function fetchAssignmentById(token: string, id: number): Promise<AssignmentRecord> {
  return apiRequest<AssignmentRecord>(`/assignments/${id}`, { token });
}

export async function fetchAssignmentStats(token: string, id: number): Promise<AssignmentStats> {
  return apiRequest<AssignmentStats>(`/assignments/${id}/stats`, { token });
}

export async function submitAssignment(
  token: string,
  assignmentId: number,
  githubLink: string,
): Promise<{ id: number; message: string }> {
  return apiRequest("/submissions", {
    method: "POST",
    body: { assignment_id: assignmentId, github_link: githubLink },
    token,
  });
}

export async function fetchSubmissionsForAssignment(token: string, assignmentId: number): Promise<SubmissionRecord[]> {
  return apiRequest<SubmissionRecord[]>(`/assignments/${assignmentId}/submissions`, { token });
}

export async function fetchUserSubmissions(token: string): Promise<SubmissionRecord[]> {
  return apiRequest<SubmissionRecord[]>("/submissions/user", { token });
}

export async function gradeSubmission(
  token: string,
  submissionId: number,
  status: "pass" | "fail",
  feedback?: string,
): Promise<{ message: string }> {
  return apiRequest(`/submissions/${submissionId}/grade`, {
    method: "PUT",
    body: { status, feedback },
    token,
  });
}

// Competitions & Reports
export async function fetchCompetitions(token: string): Promise<CompetitionRecord[]> {
  return apiRequest<CompetitionRecord[]>("/competitions", { token });
}

export async function fetchCompetitionItems(
  token: string,
  competitionId: number,
): Promise<Array<{ id: number; competition_id: number; item_id: number; quantity: number; item_name: string }>> {
  return apiRequest(`/competitions/${competitionId}/items`, { token });
}

export async function createCompetition(
  token: string,
  payload: { name: string; description?: string; start_date?: string; end_date?: string; location?: string },
): Promise<{ id: number; message?: string }> {
  return apiRequest(`/competitions`, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function addCompetitionItem(
  token: string,
  competitionId: number,
  payload: { item_id: number; quantity: number },
): Promise<{ id: number }> {
  return apiRequest(`/competitions/${competitionId}/items`, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function fetchCompetitionCalendar(token: string): Promise<CompetitionRecord[]> {
  return apiRequest<CompetitionRecord[]>("/reports/competitions/calendar", { token });
}

export async function fetchDepartmentSubmissionStats(token: string): Promise<DepartmentSubmissionStats[]> {
  return apiRequest<DepartmentSubmissionStats[]>("/statistics/submissions-by-department", { token });
}

export async function fetchSubmissionsByDepartment(token: string): Promise<DepartmentStats[]> {
  return apiRequest<DepartmentStats[]>("/statistics/submissions-by-department", { token });
}

// History & Dashboard
export async function fetchHistory(token: string): Promise<HistoryRecord[]> {
  return apiRequest<HistoryRecord[]>("/history", { token });
}

export async function fetchDashboardSummary(token: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/dashboard/summary", { token });
}

// Articles
export async function fetchArticles(token: string): Promise<ArticlesResponse> {
  return apiRequest<ArticlesResponse>("/articles", { token });
}

export async function refreshArticles(token: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/articles/refresh", {
    method: "POST",
    token,
  });
}

// Projects
export async function fetchProjects(token: string): Promise<ProjectRecord[]> {
  return apiRequest<ProjectRecord[]>("/projects", { token });
}

export async function createProject(
  token: string,
  payload: { name: string; description?: string; lead_id?: number; start_date?: string; end_date?: string },
): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>("/projects", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateProject(
  token: string,
  projectId: number,
  payload: { name?: string; description?: string; status?: string; lead_id?: number; start_date?: string; end_date?: string },
): Promise<ProjectRecord> {
  return apiRequest<ProjectRecord>(`/projects/${projectId}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function fetchProjectVolunteers(token: string, projectId: number): Promise<VolunteerRecord[]> {
  return apiRequest<VolunteerRecord[]>(`/projects/${projectId}/volunteers`, { token });
}

export async function volunteerForProject(token: string, projectId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/projects/${projectId}/volunteer`, {
    method: "POST",
    token,
  });
}

export async function resolveProjectVolunteer(
  token: string,
  projectId: number,
  volunteerId: number,
  status: "accepted" | "rejected",
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/projects/${projectId}/volunteers/${volunteerId}`, {
    method: "PUT",
    body: { status },
    token,
  });
}

// Competition volunteers
export async function fetchCompetitionVolunteers(token: string, competitionId: number): Promise<VolunteerRecord[]> {
  return apiRequest<VolunteerRecord[]>(`/competitions/${competitionId}/volunteers`, { token });
}

export async function volunteerForCompetition(token: string, competitionId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/competitions/${competitionId}/volunteer`, {
    method: "POST",
    token,
  });
}

export async function resolveCompetitionVolunteer(
  token: string,
  competitionId: number,
  volunteerId: number,
  status: "accepted" | "rejected",
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/competitions/${competitionId}/volunteers/${volunteerId}`, {
    method: "PUT",
    body: { status },
    token,
  });
}

// User applications
export async function fetchMyApplications(token: string): Promise<MyApplications> {
  return apiRequest<MyApplications>("/my-applications", { token });
}

// User management (admin)
export async function fetchAllUsers(token: string): Promise<AuthUserResponse[]> {
  return apiRequest<AuthUserResponse[]>("/users/all", { token });
}

export async function updateUserRole(token: string, userId: number, role: UserRole): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/users/${userId}/role`, {
    method: "PUT",
    body: { role },
    token,
  });
}

export async function bulkRegisterUsers(token: string, users: BulkRegisterUser[]): Promise<BulkRegisterResult> {
  return apiRequest<BulkRegisterResult>("/users/bulk-register", {
    method: "POST",
    body: { users },
    token,
  });
}
