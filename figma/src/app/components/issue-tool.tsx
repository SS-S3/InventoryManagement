import { useState, useEffect } from 'react';
import { Calendar, User, Package, Clock, Trophy, Phone, FileText, Loader, Briefcase } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { 
  fetchItems, 
  fetchCompetitions, 
  fetchProjects,
  fetchAllUsers, 
  createBorrowing,
  Item,
  CompetitionRecord,
  ProjectRecord,
  AuthUserResponse
} from '@/app/lib/api';
import { toast } from 'sonner';

export function IssueTool() {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    memberName: '',
    contactNumber: '',
    toolId: '',
    toolName: '',
    quantity: '1',
    issueDate: new Date().toISOString().split('T')[0],
    expectedReturn: '',
    purpose: '',
    competition: '',
    project: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [users, setUsers] = useState<AuthUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const [itemsData, competitionsData, projectsData, usersData] = await Promise.all([
          fetchItems(token),
          fetchCompetitions(token),
          fetchProjects(token),
          isAdmin ? fetchAllUsers(token) : Promise.resolve([]),
        ]);
        setItems(itemsData);
        setCompetitions(competitionsData);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please sign in to issue tools');
      return;
    }
    if (!formData.userId || !formData.toolName) {
      toast.error('Please select a member and tool');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const notes = [
        formData.purpose ? `Purpose: ${formData.purpose}` : '',
        formData.competition ? `Competition: ${formData.competition}` : '',
        formData.project ? `Project: ${formData.project}` : '',
        formData.details ? `Details: ${formData.details}` : '',
        formData.contactNumber ? `Contact: ${formData.contactNumber}` : '',
      ].filter(Boolean).join(' | ');

      await createBorrowing(token, {
        user_id: parseInt(formData.userId, 10),
        tool_name: formData.toolName,
        quantity: parseInt(formData.quantity, 10) || 1,
        expected_return_date: formData.expectedReturn || undefined,
        notes: notes || undefined,
      });

      toast.success('Tool issued successfully!');
      
      // Reset form
      setFormData({
        userId: '',
        memberName: '',
        contactNumber: '',
        toolId: '',
        toolName: '',
        quantity: '1',
        issueDate: new Date().toISOString().split('T')[0],
        expectedReturn: '',
        purpose: '',
        competition: '',
        project: '',
        details: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to issue tool';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const selectedUser = users.find(u => u.id.toString() === userId);
    setFormData(prev => ({
      ...prev,
      userId,
      memberName: selectedUser?.full_name || selectedUser?.username || '',
      contactNumber: selectedUser?.phone || '',
    }));
  };

  const handleToolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const toolId = e.target.value;
    const selectedTool = items.find(item => item.id.toString() === toolId);
    setFormData(prev => ({
      ...prev,
      toolId,
      toolName: selectedTool?.name || '',
    }));
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-neutral-400">Please sign in to access the tool issue form.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
          <p className="text-neutral-400">Only administrators can issue tools.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <Loader className="w-8 h-8 animate-spin text-violet-500 mr-3" />
        <span className="text-neutral-400">Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
      <div className="w-full max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-sm">
          <div className="p-6 border-b border-neutral-800">
            <h3 className="text-lg font-semibold text-white">Tool Issue Form</h3>
            <p className="text-sm text-neutral-400 mt-1">Fill in the details to issue a tool to a member</p>
          </div>

          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Member Information */}
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Member Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Select Member
                  </label>
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleUserSelect}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a member</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} {u.roll_number ? `(${u.roll_number})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="Contact number"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Auto-filled from member profile if available</p>
                </div>
              </div>
            </div>

            {/* Tool Information */}
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Tool Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Package className="inline w-4 h-4 mr-1" />
                    Tool Name
                  </label>
                  <select
                    name="toolId"
                    value={formData.toolId}
                    onChange={handleToolSelect}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a tool</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.quantity} available)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Competition / Project Information */}
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Competition or Project (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Trophy className="inline w-4 h-4 mr-1" />
                    Select Competition
                  </label>
                  <select
                    name="competition"
                    value={formData.competition}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) setFormData(prev => ({ ...prev, project: '' }));
                    }}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">No competition</option>
                    {competitions.map((comp) => (
                      <option key={comp.id} value={comp.name}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Select Project
                  </label>
                  <select
                    name="project"
                    value={formData.project}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) setFormData(prev => ({ ...prev, competition: '' }));
                    }}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">No project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.name}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Select a competition or project if this tool is being issued for a specific event or work
              </p>
            </div>

            {/* Date Information */}
            <div>
              <h4 className="text-sm font-medium text-white mb-4">Date Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Issue Date
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    name="expectedReturn"
                    value={formData.expectedReturn}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Purpose / Notes
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                rows={3}
                placeholder="Enter the purpose of using this tool..."
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <FileText className="inline w-4 h-4 mr-1" />
                Additional Details
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional details, special instructions, or conditions..."
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="p-6 rounded-b-xl flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setFormData({
                userId: '',
                memberName: '',
                contactNumber: '',
                toolId: '',
                toolName: '',
                quantity: '1',
                issueDate: new Date().toISOString().split('T')[0],
                expectedReturn: '',
                purpose: '',
                competition: '',
                project: '',
                details: '',
              })}
              className="px-6 py-2.5 border border-neutral-700 text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
              disabled={submitting}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader className="w-4 h-4 animate-spin" />}
              {submitting ? 'Issuing...' : 'Issue Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
