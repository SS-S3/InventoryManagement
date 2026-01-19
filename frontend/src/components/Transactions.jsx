import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CometCard } from './ui/comet-card';
import { ArrowDownCircle, ArrowUpCircle, History, Package, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    if (e) e.preventDefault();
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
      alert('Error processing transaction');
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Transaction Entry Form */}
      <CometCard>
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur overflow-hidden shadow-2xl rounded-3xl">
          <div className="bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 p-8">
            <div className="flex items-center gap-3 text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              Terminal Interaction
            </div>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="transaction-item">
                  Asset Selection *
                </Label>
                <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                  <SelectTrigger
                    id="transaction-item"
                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  >
                    <SelectValue placeholder="Identify component..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.quantity} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="transaction-quantity">
                  Transfer Volume *
                </Label>
                <Input
                  id="transaction-quantity"
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value, 10) || 1 })}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="transaction-type">
                  Transmission Protocol *
                </Label>
                <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                  <SelectTrigger
                    id="transaction-type"
                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <SelectItem value="issue">
                      <div className="flex items-center gap-2 font-bold text-red-500">
                        <ArrowDownCircle className="w-4 h-4" /> ISSUE
                      </div>
                    </SelectItem>
                    <SelectItem value="return">
                      <div className="flex items-center gap-2 font-bold text-green-500">
                        <ArrowUpCircle className="w-4 h-4" /> RETURN
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Button
                  type="submit"
                  className={cn(
                    "w-full border-none py-6 text-lg font-bold uppercase tracking-widest shadow-lg transition-all",
                    form.type === 'issue'
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20"
                  )}
                >
                  {form.type === 'issue' ? "Confirm Issue Protocol" : "Authorize Return Stream"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </CometCard>

      {/* Transaction History */}
      <div className="space-y-8">
        <div className="px-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <History className="w-7 h-7 text-blue-500" />
            </div>
            Movement Stream ({transactions.length})
          </h2>
        </div>

        <CometCard>
          <div className="bg-neutral-50/70 dark:bg-neutral-900/70 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-32 text-neutral-500">
              <Activity className="w-20 h-20 mx-auto mb-4 opacity-5" />
              <p className="text-xl font-medium">No system movement detected</p>
              <p className="text-sm">Real-time interactions will populate this data stream.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {transactions.map(tx => (
                <div key={tx.id} className="p-6 hover:bg-white dark:hover:bg-black/40 transition-colors group">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className={cn(
                        "p-3 rounded-2xl transition-transform group-hover:scale-110",
                        tx.type === 'issue' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                      )}>
                        {tx.type === 'issue' ? (
                          <ArrowDownCircle className="w-6 h-6" />
                        ) : (
                          <ArrowUpCircle className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-lg text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">{tx.username}</span>
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                            tx.type === 'issue' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                          )}>
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                          Processed <span className="font-black text-blue-500">{tx.quantity} units</span> of <span className="text-neutral-700 dark:text-neutral-300 font-bold">{tx.item_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest leading-tight">Timestamp</p>
                      <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                        {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </CometCard>
      </div>
    </div>
  );
};

export default Transactions;
