import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Search, Plus, Trash2, Edit2, Package, X, Check } from 'lucide-react';

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
    // Filter items based on search query
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
    e.preventDefault();
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

  const getQuantityColor = (quantity) => {
    if (quantity === 0) return 'bg-destructive/20 text-destructive border-destructive/50';
    if (quantity < 5) return 'bg-warning/20 text-warning border-warning/50';
    return 'bg-success/20 text-success border-success/50';
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form - Admin Only */}
      {userRole === 'admin' && (
        <Card className="border-2 border-primary/20 shadow-lg hover-lift">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="w-5 h-5 text-accent" />
                  Edit Item
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-primary" />
                  Add New Item
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name *</label>
                <Input
                  type="text"
                  placeholder="e.g., Arduino Uno"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-input/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cabinet Location *</label>
                <Input
                  type="text"
                  placeholder="e.g., A1, B2"
                  value={form.cabinet}
                  onChange={(e) => setForm({ ...form, cabinet: e.target.value.toUpperCase() })}
                  className="bg-input/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  type="text"
                  placeholder="Brief description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-input/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                  className="bg-input/50"
                  min="0"
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" className="flex-1 gradient-primary text-white">
                  {editingId ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Update Item
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit} className="border-destructive/50 text-destructive hover:bg-destructive/10">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Item List */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Inventory Items ({filteredItems.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Add your first inventory item above'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className={`hover-lift transition-all h-full flex flex-col justify-between ${editingId === item.id ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1 text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description || 'No description'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                          📍 {item.cabinet}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold border ${getQuantityColor(item.quantity)}`}>
                          {item.quantity} in stock
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Edit/Delete Buttons - Admin Only */}
                  {userRole === 'admin' && (
                    <div className="bg-muted/30 px-4 py-3 flex gap-2 border-t border-border/50">
                      <Button
                        onClick={() => startEdit(item)}
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteItem(item.id)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryList;