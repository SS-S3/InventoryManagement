import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Competitions = ({ token }) => {
  const [competitions, setCompetitions] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionItems, setCompetitionItems] = useState([]);
  const [form, setForm] = useState({ name: '', date: '', description: '' });
  const [itemForm, setItemForm] = useState({ item_id: '', quantity: 1 });

  useEffect(() => {
    fetchCompetitions();
    fetchItems();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await axios.get('http://localhost:3000/competitions', { headers: { Authorization: token } });
      setCompetitions(res.data);
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

  const fetchCompetitionItems = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3000/competitions/${id}/items`, { headers: { Authorization: token } });
      setCompetitionItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/competitions', form, { headers: { Authorization: token } });
      fetchCompetitions();
      setForm({ name: '', date: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3000/competitions/${selectedCompetition}/items`, itemForm, { headers: { Authorization: token } });
      fetchCompetitionItems(selectedCompetition);
      setItemForm({ item_id: '', quantity: 1 });
    } catch (err) {
      console.error(err);
    }
  };

  const selectCompetition = (id) => {
    setSelectedCompetition(id);
    fetchCompetitionItems(id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Competition</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Competition Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="date"
              placeholder="Date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button type="submit">Add Competition</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Competitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {competitions.map(competition => (
                <Card
                  key={competition.id}
                  className={`p-4 cursor-pointer ${selectedCompetition === competition.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => selectCompetition(competition.id)}
                >
                  <h4 className="font-medium">{competition.name}</h4>
                  <p className="text-sm text-muted-foreground">Date: {new Date(competition.date).toLocaleDateString()}</p>
                  <p className="text-sm">{competition.description}</p>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCompetition && (
          <Card>
            <CardHeader>
              <CardTitle>Items for Competition</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleItemSubmit} className="space-y-4 mb-4">
                <Select value={itemForm.item_id} onValueChange={(value) => setItemForm({ ...itemForm, item_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })}
                  min="1"
                  required
                />
                <Button type="submit">Add Item</Button>
              </form>
              <div className="space-y-4">
                {competitionItems.map(ci => (
                  <Card key={ci.id} className="p-4">
                    <p className="text-sm"><strong>{ci.item_name}</strong> - Quantity: {ci.quantity}</p>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Competitions;