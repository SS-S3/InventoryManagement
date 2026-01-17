import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowDownCircle, ArrowUpCircle, History, Package } from 'lucide-react';

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
      alert('Error processing transaction');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-lg hover-lift">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Issue/Return Item
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Item *</label>
              <Select value={form.item_id} onValueChange={(value) => setForm({ ...form, item_id: value })}>
                <SelectTrigger className="bg-input/50">
                  <SelectValue placeholder="Choose an item" />
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
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                className="bg-input/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type *</label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger className="bg-input/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-destructive" />
                      Issue (Take Out)
                    </div>
                  </SelectItem>
                  <SelectItem value="return">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-success" />
                      Return (Put Back)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Button type="submit" className="w-full gradient-primary text-white">
                {form.type === 'issue' ? (
                  <>
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Issue Item
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Return Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transaction History ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm">Issue or return items to see transaction history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <Card key={tx.id} className="hover-lift">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${tx.type === 'issue' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                          {tx.type === 'issue' ? (
                            <ArrowDownCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <ArrowUpCircle className="w-5 h-5 text-success" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-base">
                            <span className="text-foreground">{tx.username}</span>
                            {' '}
                            <span className={tx.type === 'issue' ? 'text-destructive' : 'text-success'}>
                              {tx.type === 'issue' ? 'issued' : 'returned'}
                            </span>
                            {' '}
                            <span className="font-semibold text-primary">{tx.quantity}</span>
                            {' '}
                            of
                            {' '}
                            <span className="font-semibold text-foreground">{tx.item_name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(tx.date).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${tx.type === 'issue'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-success/20 text-success'
                        }`}>
                        {tx.type.toUpperCase()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;