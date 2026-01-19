import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CometCard } from './ui/comet-card';
import { Share2, Trash2, Box, Send } from 'lucide-react';
import { HoverEffect } from './ui/card-hover-effect';
import { cn } from '@/lib/utils';

const Allocations = ({ token, userRole }) => {
  const [allocations, setAllocations] = useState([]);
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ item_id: '', project_id: '', allocated_quantity: 1 });

  useEffect(() => {
    fetchAllocations();
    if (userRole === 'admin') {
      fetchItems();
      fetchProjects();
    }
  }, [userRole]);

  const fetchAllocations = async () => {
    try {
      const res = await axios.get('http://localhost:3000/allocations', { headers: { Authorization: token } });
      setAllocations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:3000/items', { headers: { Authorization: token } });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:3000/projects', { headers: { Authorization: token } });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post('http://localhost:3000/allocations', form, { headers: { Authorization: token } });
      fetchAllocations();
      setForm({ item_id: '', project_id: '', allocated_quantity: 1 });
    } catch (err) {
      console.error(err);
      alert('Error allocating item');
    }
  };

  const deleteAllocation = async (id) => {
    if (!confirm('Are you sure? This will return the items to inventory.')) return;
    try {
      await axios.delete(`http://localhost:3000/allocations/${id}`, { headers: { Authorization: token } });
      fetchAllocations();
    } catch (err) {
      console.error(err);
    }
  };

  const hoverItems = allocations.map(allocation => ({
    title: allocation.item_name,
    description: (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Project</span>
          <span className="text-sm font-bold text-blue-500">{allocation.project_name}</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">
            {allocation.allocated_quantity}
            <span className="text-xs font-bold uppercase ml-1 text-neutral-500">units</span>
          </span>
          {userRole === 'admin' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm(`Restore ${allocation.allocated_quantity} units to inventory?`)) {
                  deleteAllocation(allocation.id);
                }
              }}
              className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors rounded-xl flex items-center gap-2 text-xs font-bold uppercase"
            >
              <Trash2 className="w-4 h-4" /> Release
            </button>
          )}
        </div>
      </div>
    ),
    link: '#',
  }));

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Allocation Form - Admin Only */}
      {userRole === 'admin' && (
        <CometCard>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Resource Provisioning</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="item_id" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Select Asset *</Label>
                  <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                    <SelectTrigger id="item_id">
                      <SelectValue placeholder="Identify component..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.quantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_id" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Target Project *</Label>
                  <Select value={form.project_id} onValueChange={(value) => setForm({ ...form, project_id: value })}>
                    <SelectTrigger id="project_id">
                      <SelectValue placeholder="Assign destination..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocated_quantity" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Allocation Magnitude *</Label>
                <Input
                  id="allocated_quantity"
                  type="number"
                  placeholder="Units"
                  value={form.allocated_quantity}
                  onChange={(e) => setForm({ ...form, allocated_quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-3 text-sm font-semibold uppercase tracking-widest">
                Execute Allocation
              </Button>
            </form>
          </div>
        </CometCard>
      )}

      {/* Allocations List Header */}
      <div className="space-y-8">
        <div className="px-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Share2 className="w-7 h-7 text-blue-500" />
            </div>
            Project Ledger ({allocations.length})
          </h2>
        </div>

        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 min-h-[400px]">
          {allocations.length === 0 ? (
            <div className="text-center py-32 text-neutral-500">
              <Box className="w-20 h-20 mx-auto mb-4 opacity-5" />
              <p className="text-xl font-medium">No active allocations recorded</p>
              <p className="text-sm">Initiate project support by assigning resources above.</p>
            </div>
          ) : (
            <HoverEffect items={hoverItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Allocations;
