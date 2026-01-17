import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FolderKanban, Plus } from 'lucide-react';

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
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/projects', form, { headers: { Authorization: token } });
      fetchProjects();
      setForm({ name: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Error adding project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Project Form - Admin Only */}
      {userRole === 'admin' && (
        <Card className="border-2 border-primary/20 shadow-lg hover-lift">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Project
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name *</label>
                <Input
                  type="text"
                  placeholder="e.g., Mars Rover V2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-input/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Project details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-input/50 min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white">
                Add Project
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-primary" />
            Projects ({projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>No projects found</p>
              </div>
            ) : (
              projects.map(project => (
                <Card key={project.id} className="hover-lift h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {project.description || 'No description provided.'}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;