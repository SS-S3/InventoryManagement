import { LayoutDashboard, Package, FileText, Users, BarChart3, Settings, Trophy, History, LogOut, UserCircle, Send } from 'lucide-react';

interface User {
  email: string;
  role: 'admin' | 'member';
  fullName?: string;
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: User;
  onLogout: () => void;
}

export function Sidebar({ currentPage, onNavigate, user, onLogout }: SidebarProps) {
  // Admin menu items
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tools', label: 'Tool Management', icon: Package },
    { id: 'issue', label: 'Issue Tool', icon: FileText },
    { id: 'competitions', label: 'Competitions', icon: Trophy },
    { id: 'activity', label: 'Activity Tracking', icon: History },
    { id: 'requests', label: 'Member Requests', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  // Member menu items
  const memberMenuItems = [
    { id: 'member-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'request-tool', label: 'Request Tool', icon: Send },
    { id: 'request-history', label: 'My Requests', icon: History },
  ];

  const menuItems = user.role === 'admin' ? adminMenuItems : memberMenuItems;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <img src="/sr.png" alt="Logo" className="w-50 h-50 object-contain" />
        <div>
          <h1 className="text-xl font-semibold text-gray-800">SR-DTU</h1>
          <p className="text-sm text-gray-500">Internal Software</p>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <UserCircle className="w-10 h-10 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user.fullName || user.email.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
              user.role === 'admin' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {user.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all">
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}