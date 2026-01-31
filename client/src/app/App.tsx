import { useEffect, useMemo, useState } from "react";
import { AnimatedSidebar } from "@/app/components/ui/animated-sidebar";
import { BackgroundBeams } from "@/app/components/ui/background-beams";
import { FollowingPointerCursor } from "@/app/components/ui/following-pointer-cursor";
import { Dashboard } from "@/app/components/dashboard";
import { ToolManagement } from "@/app/components/tool-management";
import { IssueTool } from "@/app/components/issue-tool";
import { Competitions } from "@/app/components/competitions";
import { ActivityTracking } from "@/app/components/activity-tracking";
import { MemberRequests } from "@/app/components/member-requests";
import { Reports } from "@/app/components/reports";
import { WeeklyTasks } from "@/app/components/weekly-tasks";
import { Login } from "@/app/components/login";
import { Register, RegisterData } from "@/app/components/register";
import { MemberDashboard } from "@/app/components/member-dashboard";
import { RequestTool } from "@/app/components/request-tool";
import { RequestHistory } from "@/app/components/request-history";
import { AdminRecruit } from "@/app/components/admin-recruit";
import { ProjectManagement } from "@/app/components/project-management";
import { UserManagement } from "@/app/components/user-management";
import { useAuth } from "@/app/providers/auth-provider";

const DEFAULT_ADMIN_PAGE = "dashboard";
const DEFAULT_MEMBER_PAGE = "member-dashboard";

export default function App() {
  const { user, login, register, logout, isLoading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [currentPage, setCurrentPage] = useState<string>(DEFAULT_ADMIN_PAGE);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (!user) return;
    setCurrentPage(user.role === "member" ? DEFAULT_MEMBER_PAGE : DEFAULT_ADMIN_PAGE);
  }, [user?.role]);

  const handleLogin = async (credentials: { email: string; password: string }): Promise<void> => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      const loggedInUser = await login(credentials.email, credentials.password);
      setCurrentPage(loggedInUser.role === "member" ? DEFAULT_MEMBER_PAGE : DEFAULT_ADMIN_PAGE);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (formData: RegisterData): Promise<void> => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      const registeredUser = await register({
        username: formData.username,
        password: formData.password,
        full_name: formData.full_name,
        roll_number: formData.roll_number,
        phone: formData.phone,
        email: formData.email,
        department: formData.department,
        gender: formData.gender,
        branch: formData.branch,
      });
      setCurrentPage(registeredUser.role === "member" ? DEFAULT_MEMBER_PAGE : DEFAULT_ADMIN_PAGE);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage(DEFAULT_ADMIN_PAGE);
    setAuthView("login");
  };

  const renderPage = useMemo(() => {
    if (!user) {
      return null;
    }

    if (user.role === "member") {
      switch (currentPage) {
        case "member-dashboard":
          return <MemberDashboard onNavigate={setCurrentPage} />;
        case "request-tool":
          return <RequestTool />;
        case "request-history":
          return <RequestHistory />;
        case "tasks":
          return <WeeklyTasks />;
        default:
          return <MemberDashboard onNavigate={setCurrentPage} />;
      }
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "tools":
        return <ToolManagement />;
      case "issue":
        return <IssueTool />;
      case "competitions":
        return <Competitions />;
      case "activity":
        return <ActivityTracking />;
      case "requests":
        return <MemberRequests />;
      case "tasks":
        return <WeeklyTasks />;
      case "reports":
        return <Reports />;
      case "recruit":
        return <AdminRecruit />;
      case "projects":
        return <ProjectManagement />;
      case "users":
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  }, [currentPage, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <span className="text-sm text-neutral-400">Loading application...</span>
      </div>
    );
  }

  if (!user) {
    return authView === "login" ? (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView("register")}
        isSubmitting={isAuthenticating}
        error={authError}
      />
    ) : (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setAuthView("login")}
        isSubmitting={isAuthenticating}
        error={authError}
      />
    );
  }

  return (
    <div className="flex h-screen bg-black text-white dark">
      <BackgroundBeams />
      {user && <FollowingPointerCursor />}
      <AnimatedSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        user={{ email: user.username, role: user.role }}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto relative z-10">
        {renderPage}
      </main>
    </div>
  );
}