import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const InventoryList = ({ token }) => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', cabinet: '', quantity: 0 });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:3000/items', { headers: { Authorization: token } });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/items', form, { headers: { Authorization: token } });
      fetchItems();
      setForm({ name: '', description: '', cabinet: '', quantity: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/items/${id}`, { headers: { Authorization: token } });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Cabinet"
              value={form.cabinet}
              onChange={(e) => setForm({ ...form, cabinet: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              required
            />
            <Button type="submit">Add Item</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map(item => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-lg">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-sm">Cabinet: {item.cabinet} | Quantity: {item.quantity}</p>
                  </div>
                  <Button onClick={() => deleteItem(item.id)} variant="destructive" size="sm">Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryList;