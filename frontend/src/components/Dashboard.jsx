import { useState, useEffect } from 'react';
import axios from 'axios';
import LabLayout from './LabLayout';
import InventoryList from './InventoryList';
import Transactions from './Transactions';
import Projects from './Projects';
import Allocations from './Allocations';
import Borrowings from './Borrowings';
import Competitions from './Competitions';
import HistoryLogs from './HistoryLogs';
import UserManagement from './UserManagement';
import DashboardStats from './DashboardStats';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LayoutGrid, Package, ArrowLeftRight, FolderKanban, Share2, Calendar, Trophy, LogOut, User, History, Users } from 'lucide-react';

const tabs = [
  { key: 'layout', label: 'Lab Layout', icon: LayoutGrid },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'allocations', label: 'Allocations', icon: Share2 },
  { key: 'borrowings', label: 'Borrowings', icon: Calendar },
  { key: 'competitions', label: 'Competitions', icon: Trophy },
  { key: 'history', label: 'History', icon: History, admin: true },
  { key: 'users', label: 'Users', icon: Users, admin: true }, // NEW TAB
];

const Dashboard = ({ token, setToken }) => {
  const [userRole, setUserRole] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
      setUsername(payload.username || 'User');
    } catch (e) {
      console.error("Invalid token");
    }
  }, [token]);

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  const visibleTabs = tabs.filter(tab => !tab.admin || userRole === 'admin');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Modern gradient header */}
      <header className="gradient-primary shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                🤖 Robotics Lab Inventory
              </h1>
              <p className="text-white/80 text-xs sm:text-sm">Manage your lab resources efficiently</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg border border-white/20 flex-1 sm:flex-initial">
                <User className="w-4 h-4 text-white flex-shrink-0" />
                <div className="text-sm min-w-0">
                  <p className="text-white font-medium truncate">{username}</p>
                  <p className="text-white/70 text-xs capitalize">{userRole}</p>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm flex-shrink-0"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <DashboardStats userRole={userRole} token={token} />

        <div className="mt-8">
          <Tabs defaultValue="inventory" className="w-full space-y-6">
            <TabsList className="grid w-full bg-card/50 backdrop-blur-sm p-1 rounded-xl mb-6" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}>
              {visibleTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="flex items-center justify-center gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white transition-all py-2.5 rounded-lg"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="layout" className="focus-visible:outline-none focus-visible:ring-0">
              <LabLayout token={token} />
            </TabsContent>
            <TabsContent value="inventory" className="focus-visible:outline-none focus-visible:ring-0">
              <InventoryList token={token} userRole={userRole} />
            </TabsContent>
            <TabsContent value="transactions" className="focus-visible:outline-none focus-visible:ring-0">
              <Transactions token={token} />
            </TabsContent>
            <TabsContent value="projects" className="focus-visible:outline-none focus-visible:ring-0">
              <Projects token={token} userRole={userRole} />
            </TabsContent>
            <TabsContent value="allocations" className="focus-visible:outline-none focus-visible:ring-0">
              <Allocations token={token} userRole={userRole} />
            </TabsContent>
            <TabsContent value="borrowings" className="focus-visible:outline-none focus-visible:ring-0">
              <Borrowings token={token} userRole={userRole} />
            </TabsContent>
            <TabsContent value="competitions" className="focus-visible:outline-none focus-visible:ring-0">
              <Competitions token={token} userRole={userRole} />
            </TabsContent>
            {userRole === 'admin' && (
              <>
                <TabsContent value="history" className="focus-visible:outline-none focus-visible:ring-0">
                  {/* Now passing userRole although HistoryLogs is admin only anyway */}
                  <HistoryLogs token={token} />
                </TabsContent>
                <TabsContent value="users" className="focus-visible:outline-none focus-visible:ring-0">
                  <UserManagement token={token} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;