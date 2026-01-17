import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Share2, Plus, Trash2 } from 'lucide-react';

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
    e.preventDefault();
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

  return (
    <div className="space-y-6">
      {/* Allocation Form - Admin Only */}
      {userRole === 'admin' && (
        <Card className="border-2 border-primary/20 shadow-lg hover-lift">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Allocate Item to Project
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item</label>
                  <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} (Qty: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={form.project_id} onValueChange={(value) => setForm({ ...form, project_id: value })}>
                    <SelectTrigger className="bg-input/50">
                      <SelectValue placeholder="Select Project" />
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
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="Allocated Quantity"
                  value={form.allocated_quantity}
                  onChange={(e) => setForm({ ...form, allocated_quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="bg-input/50"
                  required
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white">
                Allocate Resources
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Allocations List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Active Allocations ({allocations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Share2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No active allocations</p>
              </div>
            ) : (
              allocations.map(allocation => (
                <Card key={allocation.id} className="p-4 hover:bg-card/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-base">
                        <span className="font-semibold text-primary">{allocation.item_name}</span>
                        <span className="text-muted-foreground mx-2">allocated to</span>
                        <span className="font-semibold text-accent">{allocation.project_name}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: <span className="font-medium text-foreground">{allocation.allocated_quantity}</span>
                      </p>
                    </div>
                    {userRole === 'admin' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove this allocation? \n\n${allocation.allocated_quantity} items will be RESTORED to inventory.`)) {
                            deleteAllocation(allocation.id);
                          }
                        }}
                      >
                        Remove & Restore
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Allocations;