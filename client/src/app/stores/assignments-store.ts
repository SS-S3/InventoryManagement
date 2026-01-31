import { create } from "zustand";
import {
  AssignmentRecord,
  AssignmentStats,
  SubmissionRecord,
  createAssignment as apiCreateAssignment,
  fetchAssignments as apiFetchAssignments,
  fetchAssignmentById as apiFetchAssignmentById,
  fetchAssignmentStats as apiFetchAssignmentStats,
  fetchSubmissionsForAssignment as apiFetchSubmissionsForAssignment,
  fetchUserSubmissions as apiFetchUserSubmissions,
  gradeSubmission as apiGradeSubmission,
  submitAssignment as apiSubmitAssignment,
} from "@/app/lib/api";

interface AssignmentsState {
  assignments: AssignmentRecord[];
  isLoading: boolean;
  error: string | null;
  submissionsByAssignment: Record<number, SubmissionRecord[]>;
  assignmentStats: Record<number, AssignmentStats>;
  userSubmissions: SubmissionRecord[];
  fetchAssignments: (token: string) => Promise<void>;
  createAssignment: (
    token: string,
    payload: { title: string; description?: string; department: AssignmentRecord["department"]; due_date?: string; resource_url?: string },
  ) => Promise<void>;
  refetchAssignment: (token: string, id: number) => Promise<AssignmentRecord>;
  fetchAssignmentStats: (token: string, id: number) => Promise<AssignmentStats>;
  fetchSubmissionsForAssignment: (token: string, id: number) => Promise<void>;
  fetchUserSubmissions: (token: string) => Promise<void>;
  submitAssignment: (token: string, assignmentId: number, githubLink: string) => Promise<void>;
  gradeSubmission: (token: string, submissionId: number, status: "pass" | "fail", feedback?: string) => Promise<void>;
  clearError: () => void;
}

export const useAssignmentsStore = create<AssignmentsState>((set, get) => ({
  assignments: [],
  isLoading: false,
  error: null,
  submissionsByAssignment: {},
  assignmentStats: {},
  userSubmissions: [],
  fetchAssignments: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const assignments = await apiFetchAssignments(token);
      set({ assignments, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load assignments";
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },
  createAssignment: async (token, payload) => {
    set({ error: null });
    try {
      const response = await apiCreateAssignment(token, payload);
      const assignment = await apiFetchAssignmentById(token, response.id);
      set({ assignments: [assignment, ...get().assignments] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create assignment";
      set({ error: message });
      throw new Error(message);
    }
  },
  refetchAssignment: async (token, id) => {
    try {
      const assignment = await apiFetchAssignmentById(token, id);
      set({
        assignments: get().assignments.map((current) => (current.id === id ? assignment : current)),
      });
      return assignment;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch assignment";
      set({ error: message });
      throw new Error(message);
    }
  },
  fetchAssignmentStats: async (token, id) => {
    try {
      const stats = await apiFetchAssignmentStats(token, id);
      set({ assignmentStats: { ...get().assignmentStats, [id]: stats } });
      return stats;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load assignment stats";
      set({ error: message });
      throw new Error(message);
    }
  },
  fetchSubmissionsForAssignment: async (token, id) => {
    try {
      const submissions = await apiFetchSubmissionsForAssignment(token, id);
      set({ submissionsByAssignment: { ...get().submissionsByAssignment, [id]: submissions } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load submissions";
      set({ error: message });
      throw new Error(message);
    }
  },
  fetchUserSubmissions: async (token) => {
    try {
      const submissions = await apiFetchUserSubmissions(token);
      set({ userSubmissions: submissions });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load your submissions";
      set({ error: message });
      throw new Error(message);
    }
  },
  submitAssignment: async (token, assignmentId, githubLink) => {
    set({ error: null });
    try {
      await apiSubmitAssignment(token, assignmentId, githubLink);
      await get().fetchUserSubmissions(token);
      await get().fetchAssignmentStats(token, assignmentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit assignment";
      set({ error: message });
      throw new Error(message);
    }
  },
  gradeSubmission: async (token, submissionId, status, feedback) => {
    set({ error: null });
    try {
      await apiGradeSubmission(token, submissionId, status, feedback);
      const { submissionsByAssignment } = get();
      const updated = Object.fromEntries(
        Object.entries(submissionsByAssignment).map(([assignmentId, submissions]) => [
          Number(assignmentId),
          submissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, status, feedback: feedback ?? submission.feedback, graded_at: new Date().toISOString() }
              : submission,
          ),
        ]),
      );
      set({ submissionsByAssignment: updated });

      const affectedAssignments = Object.entries(updated)
        .filter(([_, submissions]) => submissions.some((submission) => submission.id === submissionId))
        .map(([assignmentId]) => Number(assignmentId));

      await Promise.all(
        affectedAssignments.map((assignmentId) =>
          apiFetchAssignmentStats(token, assignmentId).then((stats) => {
            set((state) => ({
              assignmentStats: { ...state.assignmentStats, [assignmentId]: stats },
            }));
          }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to grade submission";
      set({ error: message });
      throw new Error(message);
    }
  },
  clearError: () => set({ error: null }),
}));
