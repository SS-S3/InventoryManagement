import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Borrowings = ({ token }) => {
  const [borrowings, setBorrowings] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ item_id: '', quantity: 1, expected_return_date: '' });

  useEffect(() => {
    fetchBorrowings();
    fetchItems();
  }, []);

  const fetchBorrowings = async () => {
    try {
      const res = await axios.get('http://localhost:3000/borrowings', { headers: { Authorization: token } });
      setBorrowings(res.data);
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
      await axios.post('http://localhost:3000/borrowings', form, { headers: { Authorization: token } });
      fetchBorrowings();
      fetchItems();
      setForm({ item_id: '', quantity: 1, expected_return_date: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const returnItem = async (id, quantity) => {
    try {
      await axios.put(`http://localhost:3000/borrowings/${id}/return`, { quantity }, { headers: { Authorization: token } });
      fetchBorrowings();
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Borrow Item</CardTitle>
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
            <Input
              type="date"
              placeholder="Expected Return Date"
              value={form.expected_return_date}
              onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })}
              required
            />
            <Button type="submit">Borrow</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Borrowings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {borrowings.map(borrowing => (
              <Card key={borrowing.id} className="p-4">
                <div>
                  <p className="text-sm"><strong>{borrowing.username}</strong> borrowed <strong>{borrowing.quantity}</strong> of <strong>{borrowing.item_name}</strong></p>
                  <p className="text-sm text-muted-foreground">Borrowed on: {new Date(borrowing.borrow_date).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Expected return: {new Date(borrowing.expected_return_date).toLocaleDateString()}</p>
                  {borrowing.actual_return_date ? (
                    <p className="text-sm text-green-600">Returned on: {new Date(borrowing.actual_return_date).toLocaleDateString()}</p>
                  ) : (
                    <Button onClick={() => returnItem(borrowing.id, borrowing.quantity)} variant="outline" size="sm" className="mt-2">Return</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Borrowings;