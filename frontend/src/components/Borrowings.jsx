import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const Borrowings = ({ token, userRole }) => {
  const [borrowings, setBorrowings] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ item_id: '', quantity: 1, expected_return_date: '' });
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUsername(payload.username);
    } catch (e) {
      console.error(e);
    }
  }, [token]);

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
      fetchItems(); // Quantity changed
      setForm({ item_id: '', quantity: 1, expected_return_date: '' });
    } catch (err) {
      console.error(err);
      alert('Error processing borrowing');
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
      {/* Borrow Form */}
      <Card className="border-2 border-primary/20 shadow-lg hover-lift">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Borrow Item
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item</label>
                <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                  <SelectTrigger className="bg-input/50">
                    <SelectValue placeholder="Select Item to Borrow" />
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
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="bg-input/50"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Expected Return Date</label>
                <Input
                  type="date"
                  value={form.expected_return_date}
                  onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })}
                  className="bg-input/50"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-white">
              Confirm Borrowing
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Borrowings List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Active Borrowings ({borrowings.filter(b => !b.actual_return_date).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {borrowings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No borrowing history</p>
              </div>
            ) : (
              borrowings.map(borrowing => {
                const isOverdue = !borrowing.actual_return_date && new Date(borrowing.expected_return_date) < new Date();
                const isReturned = !!borrowing.actual_return_date;
                const canReturn = !isReturned && (userRole === 'admin' || borrowing.username === currentUsername);

                return (
                  <Card key={borrowing.id} className={`p-4 transition-all hover:bg-card/50 ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{borrowing.item_name}</span>
                          <span className="text-sm text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                            x{borrowing.quantity}
                          </span>
                          {isOverdue && <span className="text-xs font-bold text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> OVERDUE</span>}
                          {isReturned && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> RETURNED</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <p>User: <span className="text-foreground font-medium">{borrowing.username}</span></p>
                          <p>Borrowed: {new Date(borrowing.borrow_date).toLocaleDateString()}</p>
                          <p>Due: {new Date(borrowing.expected_return_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {canReturn && (
                        <Button
                          onClick={() => returnItem(borrowing.id, borrowing.quantity)}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto hover:bg-primary/10 hover:text-primary border-primary/30"
                        >
                          Mark Returned
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Borrowings;