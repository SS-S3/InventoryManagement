import { Search, Calendar, AlertCircle, RefreshCw, Package } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { fetchItems, createRequest, Item } from '@/app/lib/api';
import { useAuth } from '@/app/providers/auth-provider';
import { toast } from 'sonner';

export function RequestTool() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    purpose: '',
    quantity: 1,
    expectedReturnDate: '',
    notes: '',
  });

  const loadItems = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchItems(token);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !token) {
      toast.error('Please select a tool');
      return;
    }
    if (!formData.purpose || !formData.expectedReturnDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.quantity > (selectedItem.available_quantity ?? selectedItem.quantity)) {
      toast.error('Requested quantity exceeds available stock');
      return;
    }

    try {
      setSubmitting(true);
      await createRequest(token, {
        title: `Request for ${selectedItem.name}`,
        tool_name: selectedItem.name,
        quantity: formData.quantity,
        reason: formData.notes ? `${formData.purpose}. Notes: ${formData.notes}` : formData.purpose,
        expected_return_date: formData.expectedReturnDate,
      });
      toast.success('Request submitted successfully! Admin will review your request.');
      
      // Reset form
      setSelectedItem(null);
      setFormData({
        purpose: '',
        quantity: 1,
        expectedReturnDate: '',
        notes: '',
      });
      // Refresh items to get updated quantities
      loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Request Tool</h2>
          <p className="text-neutral-500 mt-1">Submit a request to borrow lab equipment</p>
        </div>
        <button
          onClick={loadItems}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Tools List */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-lg font-semibold text-white mb-4">Available Tools</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Loading items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No items found</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const available = item.available_quantity ?? item.quantity;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full p-4 border-b border-neutral-800 text-left hover:bg-neutral-800 transition-colors ${
                        selectedItem?.id === item.id ? 'bg-blue-500/20 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <h4 className="font-medium text-white text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-neutral-500 mb-2">{item.category || 'Uncategorized'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">
                          Available: {available}/{item.quantity}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          available > 0 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {available > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm">
            <div className="p-6 border-b border-neutral-800">
              <h3 className="text-lg font-semibold text-white">Request Details</h3>
              <p className="text-sm text-neutral-500 mt-1">Fill in the information below</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Selected Tool Display */}
              {selectedItem && (
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-blue-400 font-medium mb-1">Selected Tool</p>
                      <h4 className="font-semibold text-white">{selectedItem.name}</h4>
                      <p className="text-sm text-neutral-400 mt-1">{selectedItem.category || 'Uncategorized'}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                      {selectedItem.available_quantity ?? selectedItem.quantity} available
                    </span>
                  </div>
                </div>
              )}

              {!selectedItem && (
                <div className="mb-6 p-4 bg-neutral-800 border border-neutral-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-400">
                    Please select a tool from the list on the left to continue.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Purpose of Request <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g., Electronics Lab Project, Research Work, Competition"
                    className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Quantity and Return Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedItem?.available_quantity ?? selectedItem?.quantity ?? 1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Expected Return Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="date"
                        required
                        value={formData.expectedReturnDate}
                        onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional information or special requirements..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={!selectedItem || submitting}
                    className="mt-4 w-full py-2 text-sm text-blue-400 hover:text-blue-700 font-medium border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setFormData({
                        purpose: '',
                        quantity: 1,
                        expectedReturnDate: '',
                        notes: '',
                      });
                    }}
                    className="px-6 py-3 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
