import { useState, useEffect } from 'react';
import axios from 'axios';
import LabLayout from './LabLayout';
import InventoryList from './InventoryList';
import Transactions from './Transactions';
import Projects from './Projects';
import Allocations from './Allocations';
import Borrowings from './Borrowings';
import Competitions from './Competitions';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const tabs = [
  { key: 'layout', label: 'Lab Layout' },
  { key: 'inventory', label: 'Inventory', admin: true },
  { key: 'transactions', label: 'Transactions' },
  { key: 'projects', label: 'Projects' },
  { key: 'allocations', label: 'Allocations' },
  { key: 'borrowings', label: 'Borrowings' },
  { key: 'competitions', label: 'Competitions' },
];

const Dashboard = ({ token, setToken }) => {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUserRole(payload.role);
  }, [token]);

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  const visibleTabs = tabs.filter(tab => !tab.admin || userRole === 'admin');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Robotics Lab Inventory Management</h1>
          <Button onClick={logout} variant="secondary" size="sm">Logout</Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="layout" className="w-full">
          <TabsList className="flex w-full">
            {visibleTabs.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex-1 text-sm">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="layout">
            <LabLayout token={token} />
          </TabsContent>
          {userRole === 'admin' && (
            <TabsContent value="inventory">
              <InventoryList token={token} />
            </TabsContent>
          )}
          <TabsContent value="transactions">
            <Transactions token={token} />
          </TabsContent>
          <TabsContent value="projects">
            <Projects token={token} />
          </TabsContent>
          <TabsContent value="allocations">
            <Allocations token={token} />
          </TabsContent>
          <TabsContent value="borrowings">
            <Borrowings token={token} />
          </TabsContent>
          <TabsContent value="competitions">
            <Competitions token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;