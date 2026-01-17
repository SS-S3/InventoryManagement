import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Allocations = ({ token }) => {
  const [allocations, setAllocations] = useState([]);
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ item_id: '', project_id: '', allocated_quantity: 1 });

  useEffect(() => {
    fetchAllocations();
    fetchItems();
    fetchProjects();
  }, []);

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
    }
  };

  const deleteAllocation = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/allocations/${id}`, { headers: { Authorization: token } });
      fetchAllocations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Allocate Item to Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Item" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.project_id} onValueChange={(value) => setForm({ ...form, project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Allocated Quantity"
              value={form.allocated_quantity}
              onChange={(e) => setForm({ ...form, allocated_quantity: parseInt(e.target.value) })}
              min="1"
              required
            />
            <Button type="submit">Allocate</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allocations.map(allocation => (
              <Card key={allocation.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm"><strong>{allocation.item_name}</strong> allocated to <strong>{allocation.project_name}</strong></p>
                    <p className="text-sm text-muted-foreground">Quantity: {allocation.allocated_quantity}</p>
                  </div>
                  <Button onClick={() => deleteAllocation(allocation.id)} variant="destructive" size="sm">Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Allocations;