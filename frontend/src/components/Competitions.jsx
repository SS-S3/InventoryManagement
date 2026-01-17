import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Plus, Calendar as CalendarIcon, Package, X } from 'lucide-react';

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
    e.preventDefault();
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
    e.preventDefault();
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
        <Card className="border-2 border-primary/20 shadow-lg hover-lift">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Add New Competition
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Competition Name *</label>
                <Input
                  type="text"
                  placeholder="e.g., RoboWar 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-input/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-input/50"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of the competition"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-input/50 min-h-20"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Competition
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Competitions List and Resource Allocation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Competitions List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Competitions ({competitions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {competitions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No competitions yet</p>
                {userRole === 'admin' && <p className="text-sm">Create your first competition above</p>}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {competitions.map(competition => (
                  <Card
                    key={competition.id}
                    className={`cursor-pointer transition-all hover-lift ${selectedCompetition === competition.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-card/80'
                      }`}
                    onClick={() => selectCompetition(competition.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base mb-1 truncate">{competition.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(competition.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {competition.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{competition.description}</p>
                          )}
                        </div>
                        {selectedCompetition === competition.id && (
                          <div className="px-2 py-1 bg-primary text-white text-xs rounded-full font-semibold">
                            SELECTED
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource Allocation Panel */}
        <Card className={`shadow-lg ${selectedCompetition ? 'ring-2 ring-primary/30' : ''}`}>
          <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-accent" />
                {selectedCompetition ? `Resources for ${selectedCompData?.name}` : 'Resource Allocation'}
              </CardTitle>
              {selectedCompetition && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectCompetition}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!selectedCompetition ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a competition</p>
                <p className="text-sm">Click on a competition to view its resources</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Add Item Form - Admin Only */}
                {userRole === 'admin' && (
                  <form onSubmit={handleItemSubmit} className="space-y-4 p-4 bg-muted/20 rounded-lg">
                    <h3 className="font-semibold text-sm">Add Resource</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Item *</label>
                        <Select value={itemForm.item_id} onValueChange={(value) => setItemForm({ ...itemForm, item_id: value })}>
                          <SelectTrigger className="bg-input/50">
                            <SelectValue placeholder="Select item" />
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
                          placeholder="Qty"
                          value={itemForm.quantity}
                          onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })}
                          min="1"
                          className="bg-input/50"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Resource
                    </Button>
                  </form>
                )}

                {/* Allocated Items List */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Allocated Resources ({competitionItems.length})</h3>
                  {competitionItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No resources allocated yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {competitionItems.map(ci => (
                        <div
                          key={ci.id}
                          className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover-lift"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Package className="w-4 h-4 text-accent flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ci.item_name}</p>
                              <p className="text-xs text-muted-foreground">Quantity: {ci.quantity}</p>
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full font-semibold">
                            {ci.quantity} units
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Competitions;