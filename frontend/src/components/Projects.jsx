import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/stateful-button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CometCard } from './ui/comet-card';
import { FolderKanban, Plus } from 'lucide-react';
import { HoverEffect } from './ui/card-hover-effect';

const Projects = ({ token, userRole }) => {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:3000/projects', { headers: { Authorization: token } });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post('http://localhost:3000/projects', form, { headers: { Authorization: token } });
      fetchProjects();
      setForm({ name: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Error adding project');
    }
  };

  const hoverItems = projects.map(project => ({
    title: project.name,
    description: project.description || 'No description provided.',
    link: '#', // For now
  }));

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Add Project Form - Admin Only */}
      {userRole === 'admin' && (
        <CometCard>
          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Plus className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">Launch New Project</h2>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Project Name *</Label>
                <Input
                  id="project-name"
                  type="text"
                  placeholder="e.g., Autonomous Laboratory Assistant"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-description" className="text-xs font-bold uppercase tracking-widest text-neutral-500">Project Scope & Objectives</Label>
                <Textarea
                  id="project-description"
                  placeholder="Describe the mission, timeline, and required resources..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[120px]"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-3 text-sm font-semibold uppercase tracking-widest">
                  Initialize Project
                </Button>
              </div>
            </form>
          </div>
        </CometCard>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-3xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FolderKanban className="w-7 h-7 text-blue-500" />
            </div>
            Active Initiatives ({projects.length})
          </h2>
        </div>

        <div className="bg-neutral-50/50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4">
          {projects.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <FolderKanban className="w-20 h-20 mx-auto mb-4 opacity-5" />
              <p className="text-xl font-medium">No active projects found</p>
              <p className="text-sm">New initiatives will appear here once registered.</p>
            </div>
          ) : (
            <HoverEffect items={hoverItems} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
