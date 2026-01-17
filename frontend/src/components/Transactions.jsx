import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Transactions = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ item_id: '', quantity: 1, type: 'issue' });

  useEffect(() => {
    fetchTransactions();
    fetchItems();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:3000/transactions', { headers: { Authorization: token } });
      setTransactions(res.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.type === 'issue') {
        await axios.post('http://localhost:3000/issue', { item_id: form.item_id, quantity: form.quantity }, { headers: { Authorization: token } });
      } else {
        await axios.post('http://localhost:3000/return', { item_id: form.item_id, quantity: form.quantity }, { headers: { Authorization: token } });
      }
      fetchTransactions();
      fetchItems();
      setForm({ item_id: '', quantity: 1, type: 'issue' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issue/Return Item</CardTitle>
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
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              min="1"
              required
            />
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="return">Return</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Submit</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              <Card key={tx.id} className="p-4">
                <p className="text-sm">
                  <strong>{tx.username}</strong> {tx.type}d <strong>{tx.quantity}</strong> of <strong>{tx.item_name}</strong> on {new Date(tx.date).toLocaleString()}
                </p>
              </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;