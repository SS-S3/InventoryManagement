import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CometCard } from './ui/comet-card';
import { Calendar, CheckCircle2, AlertCircle, RefreshCw, Bookmark, Clock } from 'lucide-react';
import { HoverEffect } from './ui/card-hover-effect';
import { cn } from '@/lib/utils';

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
    if (e) e.preventDefault();
    try {
      await axios.post('http://localhost:3000/borrowings', form, { headers: { Authorization: token } });
      fetchBorrowings();
      fetchItems();
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

  const hoverItems = borrowings.map(borrowing => {
    const isOverdue = !borrowing.actual_return_date && new Date(borrowing.expected_return_date) < new Date();
    const isReturned = !!borrowing.actual_return_date;
    const canReturn = !isReturned && (userRole === 'admin' || borrowing.username === currentUsername);

    return {
      title: borrowing.item_name,
      description: (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Borrower: {borrowing.username}</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-blue-500">x{borrowing.quantity}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <Clock className="w-3 h-3" />
              <span>Issued: {new Date(borrowing.borrow_date).toLocaleDateString()}</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 text-[11px] font-bold",
              isOverdue ? "text-red-500" : "text-neutral-500"
            )}>
              <Calendar className="w-3 h-3" />
              <span>Deadline: {new Date(borrowing.expected_return_date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex gap-2">
              {isReturned ? (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Returned
                </span>
              ) : isOverdue ? (
                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Overdue
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                  <Bookmark className="w-3 h-3" /> Active
                </span>
              )}
            </div>
            {canReturn && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); returnItem(borrowing.id, borrowing.quantity); }}
                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors"
              >
                Process Return &rarr;
              </button>
            )}
          </div>
        </div>
      ),
      link: '#',
    };
  });

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Borrow Form */}
      <CometCard>
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Acquisition Request</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="borrow-item" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Asset Identity *</Label>
                <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                  <SelectTrigger id="borrow-item">
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
                <Label htmlFor="borrow-quantity" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Request Volume *</Label>
                <Input
                  id="borrow-quantity"
                  type="number"
                  placeholder="Units"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="borrow-return" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Return Commitment Date *</Label>
                <Input
                  id="borrow-return"
                  type="date"
                  value={form.expected_return_date}
                  onChange={(e) => setForm({ ...form, expected_return_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-3 text-sm font-semibold uppercase tracking-widest">
              Authorize Acquisition
            </Button>
          </form>
        </div>
      </CometCard>

      {/* Borrowings List Header */}
      <div className="space-y-8">
        <div className="px-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <RefreshCw className="w-7 h-7 text-blue-500" />
            </div>
            Acquisition History ({borrowings.filter(b => !b.actual_return_date).length} Active)
          </h2>
        </div>

        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 min-h-[400px]">
          {borrowings.length === 0 ? (
            <div className="text-center py-32 text-neutral-500">
              <Calendar className="w-20 h-20 mx-auto mb-4 opacity-5" />
              <p className="text-xl font-medium">No acquisition records found</p>
              <p className="text-sm">New requests will appear in this chronological ledger.</p>
            </div>
          ) : (
            <HoverEffect items={hoverItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Borrowings;
