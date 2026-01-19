import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CometCard } from './ui/comet-card';
import { Search, Plus, Trash2, Edit2, Package, X, Check } from 'lucide-react';
import { HoverEffect } from './ui/card-hover-effect';
import { cn } from '@/lib/utils';

const InventoryList = ({ token, userRole }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ name: '', description: '', cabinet: '', quantity: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cabinet.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

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
      if (editingId) {
        await axios.put(`http://localhost:3000/items/${editingId}`, form, { headers: { Authorization: token } });
        setEditingId(null);
      } else {
        await axios.post('http://localhost:3000/items', form, { headers: { Authorization: token } });
      }
      fetchItems();
      setForm({ name: '', description: '', cabinet: '', quantity: 0 });
    } catch (err) {
      console.error(err);
      alert('Error saving item');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`http://localhost:3000/items/${id}`, { headers: { Authorization: token } });
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (item) => {
    setForm({ name: item.name, description: item.description, cabinet: item.cabinet, quantity: item.quantity });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', description: '', cabinet: '', quantity: 0 });
  };

  const getQuantityBadge = (quantity) => {
    if (quantity === 0) return 'bg-red-500/20 text-red-500';
    if (quantity < 5) return 'bg-yellow-500/20 text-yellow-500';
    return 'bg-green-500/20 text-green-500';
  };

  const hoverItems = filteredItems.map(item => ({
    title: item.name,
    description: (
      <div className="flex flex-col gap-2">
        <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
          {item.description || "No detailed specs provided."}
        </p>
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              📍 {item.cabinet}
            </span>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-[11px] font-bold shadow-sm",
            getQuantityBadge(item.quantity)
          )}>
            {item.quantity} in stock
          </div>
        </div>
        {userRole === 'admin' && (
          <div className="flex gap-2 mt-4 pointer-events-auto">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(item); }}
              className="flex-1 py-1.5 px-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-blue-500/20 hover:text-blue-500 transition-colors rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteItem(item.id); }}
              className="p-1.5 px-3 bg-neutral-200 dark:bg-neutral-800 hover:bg-red-500/20 hover:text-red-500 transition-colors rounded-lg text-xs flex items-center justify-center"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    ),
    link: '#',
  }));

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Add/Edit Form - Admin Only */}
      {userRole === 'admin' && (
        <CometCard>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                {editingId ? "Update Asset Identity" : "Catalog New Asset"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="item-name" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Asset Title *</Label>
                <Input
                  id="item-name"
                  type="text"
                  placeholder="e.g., Lidar Sensor Pro"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-cabinet" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Storage Unit Index *</Label>
                <Input
                  id="item-cabinet"
                  type="text"
                  placeholder="e.g., A4"
                  value={form.cabinet}
                  onChange={(e) => setForm({ ...form, cabinet: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="item-description" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Technical Briefing</Label>
                <Input
                  id="item-description"
                  type="text"
                  placeholder="High-frequency precision optics..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-quantity" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Unit Quantity *</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-4 mt-2">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none py-3 text-sm font-semibold uppercase tracking-widest">
                  {editingId ? "Commit Changes" : "Register Item"}
                </Button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500/10 hover:text-red-500 text-neutral-600 dark:text-neutral-300 rounded-2xl font-semibold uppercase tracking-widest transition-colors"
                  >
                    Discard
                  </button>
                )}
              </div>
            </form>
          </div>
        </CometCard>
      )}

      {/* Item List Header */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="w-7 h-7 text-blue-500" />
            </div>
            Inventory Registry ({filteredItems.length})
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by label or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 min-h-[400px]">
          {filteredItems.length === 0 ? (
            <div className="text-center py-32 text-neutral-500">
              <Package className="w-20 h-20 mx-auto mb-4 opacity-5" />
              <p className="text-xl font-medium">No assets matching criteria</p>
              <p className="text-sm">Verify the search query or check the cabinet index.</p>
            </div>
          ) : (
            <HoverEffect items={hoverItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;
