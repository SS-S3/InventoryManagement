import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/components/ui/utils";
import {
  LayoutDashboard,
  Package,
  Send,
  Trophy,
  Activity,
  FileText,
  Users,
  ClipboardList,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  UserPlus,
  FolderKanban,
  Shield,
} from "lucide-react";

interface Link {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const AnimatedSidebar = ({
  currentPage,
  onNavigate,
  user,
  onLogout,
  className,
}: {
  currentPage: string;
  onNavigate: (page: string) => void;
  user?: { email: string; role: "admin" | "member"; fullName?: string };
  onLogout: () => void;
  className?: string;
}) => {
  const [open, setOpen] = useState(true);

  const adminLinks: Link[] = [
    {
      label: "Dashboard",
      href: "dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Tools",
      href: "tools",
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: "Issue Tool",
      href: "issue",
      icon: <Send className="h-5 w-5" />,
    },
    {
      label: "Competitions",
      href: "competitions",
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      label: "Activity",
      href: "activity",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      label: "Requests",
      href: "requests",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Projects",
      href: "projects",
      icon: <FolderKanban className="h-5 w-5" />,
    },
    {
      label: "Reports",
      href: "reports",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Weekly Tasks",
      href: "tasks",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      label: "Recruit Members",
      href: "recruit",
      icon: <UserPlus className="h-5 w-5" />,
    },
    {
      label: "User Management",
      href: "users",
      icon: <Shield className="h-5 w-5" />,
    },
  ];

  const memberLinks: Link[] = [
    {
      label: "Dashboard",
      href: "member-dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Request Tool",
      href: "request-tool",
      icon: <Send className="h-5 w-5" />,
    },
    {
      label: "My Requests",
      href: "request-history",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Weekly Tasks",
      href: "tasks",
      icon: <CheckSquare className="h-5 w-5" />,
    },
  ];

  const links = user?.role === "member" ? memberLinks : adminLinks;

  return (
    <motion.div
      animate={{
        width: open ? "280px" : "80px",
      }}
      className={cn(
        "relative h-screen border-r border-neutral-800 bg-black/40 backdrop-blur-xl flex flex-col",
        className
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-7 h-6 w-6 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 transition-colors z-10"
      >
        {open ? (
          <ChevronLeft className="h-4 w-4 text-neutral-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-neutral-400" />
        )}
      </button>

      {/* Logo */}
      <div className="p-6 border-b border-neutral-800">
        <motion.div
          animate={{
            scale: open ? 1 : 0.8,
          }}
          className="flex items-center gap-3"
        >
          <img src="/sr.png" alt="Logo" className="h-10 w-10 object-contain" />
          {open && (
            <div>
              <h2 className="text-white font-semibold">SR-DTU</h2>
              <p className="text-neutral-400 text-xs">Internal Software</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => (
          <button
            key={link.href}
            onClick={() => onNavigate(link.href)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative",
              currentPage === link.href
                ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            )}
          >
            {currentPage === link.href && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-lg"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{link.icon}</span>
            {open && <span className="relative z-10">{link.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-neutral-800">
          <div className="mb-3">
            <div className={cn("flex items-center gap-3", !open && "justify-center")}>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              {open && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-white text-sm font-medium truncate">
                    {user.fullName || user.email}
                  </p>
                  <p className="text-neutral-400 text-xs capitalize">{user.role}</p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors",
              !open && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {open && <span>Logout</span>}
          </button>
        </div>
      )}
    </motion.div>
  );
};