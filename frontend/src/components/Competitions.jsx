import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Trophy, Plus, Calendar as CalendarIcon, Package, X } from 'lucide-react';
import { CometCard } from './ui/comet-card';
import { cn } from '@/lib/utils';

const Competitions = ({ token, userRole }) => {
  const [competitions, setCompetitions] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionItems, setCompetitionItems] = useState([]);
  const [form, setForm] = useState({ name: '', date: '', description: '' });
  const [itemForm, setItemForm] = useState({ item_id: '', quantity: 1 });

  useEffect(() => {
    fetchCompetitions();
    if (userRole === 'admin') {
      fetchItems();
    }
  }, [userRole]);

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
    if (e) e.preventDefault();
    try {
      await axios.post('http://localhost:3000/competitions', form, { headers: { Authorization: token } });
      fetchCompetitions();
      setForm({ name: '', date: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Error creating competition');
    }
  };

  const handleItemSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCompetition) {
      alert('Please select a competition first');
      return;
    }
    try {
      await axios.post(`http://localhost:3000/competitions/${selectedCompetition}/items`, itemForm, { headers: { Authorization: token } });
      fetchCompetitionItems(selectedCompetition);
      setItemForm({ item_id: '', quantity: 1 });
    } catch (err) {
      console.error(err);
      alert('Error adding item to competition');
    }
  };

  const selectCompetition = (id) => {
    setSelectedCompetition(id);
    fetchCompetitionItems(id);
  };

  const deselectCompetition = () => {
    setSelectedCompetition(null);
    setCompetitionItems([]);
  };

  const selectedCompData = competitions.find(c => c.id === selectedCompetition);

  return (
    <div className="space-y-6">
      {/* Add New Competition Form - Admin Only */}
      {userRole === 'admin' && (
        <CometCard>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl p-8 space-y-6">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold">Add New Competition</h2>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="competition-name">Competition Name *</Label>
                <Input
                  id="competition-name"
                  type="text"
                  placeholder="e.g., RoboWar 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competition-date">Date *</Label>
                <Input
                  id="competition-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="competition-description">Description</Label>
                <Textarea
                  id="competition-description"
                  placeholder="Brief description of the competition"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-20"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Competition
                </Button>
              </div>
            </form>
          </div>
        </CometCard>
      )}

      {/* Competitions List and Resource Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Competitions List */}
        <CometCard>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl">
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 px-6 py-4 text-neutral-800 dark:text-neutral-200">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Competitions ({competitions.length})</h2>
            </div>
            <div className="p-6">
              {competitions.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-medium">No competitions yet</p>
                  {userRole === 'admin' && <p className="text-sm">Create your first competition above</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-2">
                  {competitions.map((competition) => (
                    <CometCard
                      key={competition.id}
                      className={cn(
                        "w-full cursor-pointer transition-transform",
                        selectedCompetition === competition.id && "ring-2 ring-blue-500 rounded-2xl"
                      )}
                    >
                      <div
                        className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 h-full w-full"
                        onClick={() => selectCompetition(competition.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xl mb-1 truncate text-neutral-800 dark:text-neutral-100">
                              {competition.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                              <CalendarIcon className="w-3 h-3 text-blue-500" />
                              {new Date(competition.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            {competition.description && (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 italic">
                                {competition.description}
                              </p>
                            )}
                          </div>
                          {selectedCompetition === competition.id && (
                            <div className="px-3 py-1 bg-blue-600 text-white text-[10px] rounded-full font-bold uppercase tracking-wider shadow-lg">
                              ACTIVE
                            </div>
                          )}
                        </div>
                      </div>
                    </CometCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CometCard>

        {/* Resource Allocation Panel */}
        <CometCard className={cn("h-full", selectedCompetition && "ring-2 ring-blue-500/30")}> 
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl h-full">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 px-6 py-4 text-neutral-800 dark:text-neutral-200">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold">
                  {selectedCompetition ? `Resources: ${selectedCompData?.name}` : 'Resource Allocation'}
                </h2>
              </div>
              {selectedCompetition && (
                <button
                  onClick={deselectCompetition}
                  className="p-1 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-6">
              {!selectedCompetition ? (
                <div className="text-center py-12 text-neutral-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-medium">Select a competition</p>
                  <p className="text-sm">Click on a competition to view its resources</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Add Item Form - Admin Only */}
                  {userRole === 'admin' && (
                    <form onSubmit={handleItemSubmit} className="space-y-4 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                      <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Assign New Resource</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="competition-item-select">
                            Item *
                          </Label>
                          <Select value={itemForm.item_id} onValueChange={(value) => setItemForm({ ...itemForm, item_id: value })}>
                            <SelectTrigger
                              id="competition-item-select"
                              className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                            >
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                              {items.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name} ({item.quantity} available)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500" htmlFor="competition-item-quantity">
                            Quantity *
                          </Label>
                          <Input
                            id="competition-item-quantity"
                            type="number"
                            placeholder="Qty"
                            value={itemForm.quantity}
                            onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value, 10) || 1 })}
                            min="1"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-4 text-sm font-bold uppercase tracking-wider">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Resource
                      </Button>
                    </form>
                  )}

                  {/* Allocated Items List */}
                  <div>
                    <h3 className="font-bold text-sm mb-4 text-neutral-800 dark:text-neutral-200 uppercase tracking-widest px-2">
                      Current Allocation ({competitionItems.length})
                    </h3>
                    {competitionItems.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-5" />
                        <p className="text-sm">No resources allocated yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {competitionItems.map((ci) => (
                          <div
                            key={ci.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate dark:text-neutral-200">{ci.item_name}</p>
                                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-tighter">Inventory Managed</p>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-blue-500/10 text-blue-500 text-xs rounded-full font-bold">
                              {ci.quantity} units
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CometCard>
      </div>
    </div>
  );
};

export default Competitions;
