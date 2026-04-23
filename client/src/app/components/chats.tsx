import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/app/stores/auth-store";
import { fetchProjects, fetchMyApplications, fetchProjectChats, sendProjectChat, ProjectRecord, ProjectChat } from "@/app/lib/api";
import { formatDate } from "@/app/lib/date";
import { Loader, Send, MessageSquare } from "lucide-react";

export function ProjectChats() {
  const { token, user } = useAuthStore();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [chats, setChats] = useState<ProjectChat[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const chatsEndRef = useRef<HTMLDivElement>(null);

  const loadProjects = useCallback(async () => {
    if (!token || !user) return;
    try {
      const allProjects = await fetchProjects(token);
      
      if (user.role === 'admin') {
        setProjects(allProjects);
      } else {
        const apps = await fetchMyApplications(token);
        const acceptedProjectIds = apps.projects
          .filter(p => p.status === 'accepted')
          .map(p => p.project_id);
          
        const accessibleProjects = allProjects.filter(p => 
          p.lead_id === user.id || acceptedProjectIds.includes(p.id)
        );
        setProjects(accessibleProjects);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token) loadProjects();
  }, [token, loadProjects]);

  const loadChats = useCallback(async (projectId: number) => {
    if (!token) return;
    setIsChatLoading(true);
    setErrorMsg("");
    try {
      const data = await fetchProjectChats(token, projectId);
      setChats(data);
    } catch (error: any) {
      console.error("Failed to load chats", error);
      setErrorMsg(error.message || "Access denied or failed to load chats");
      setChats([]);
    } finally {
      setIsChatLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedProjectId) {
      loadChats(selectedProjectId);
    }
  }, [token, selectedProjectId, loadChats]);

  useEffect(() => {
    chatsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProjectId || !message.trim()) return;
    setIsSending(true);
    try {
      await sendProjectChat(token, selectedProjectId, message.trim());
      setMessage("");
      await loadChats(selectedProjectId);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-8 h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Project Chats</h2>
        <p className="text-neutral-400 mt-1">
          Communicate with your project team members. Messages are retained for 75 days.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden bg-neutral-900 border border-neutral-800 rounded-xl">
        {/* Sidebar Projects List */}
        <div className="w-1/3 border-r border-neutral-800 flex flex-col">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/50">
            <h3 className="font-semibold text-white">Your Projects</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {projects.length === 0 ? (
              <p className="text-neutral-500 p-4 text-sm text-center">No accessible projects.</p>
            ) : (
              projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedProjectId === project.id ? 'bg-violet-500/20 text-violet-300' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-medium truncate">{project.name}</p>
                    {project.lead_id === user?.id && <p className="text-xs text-violet-400">Lead</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-neutral-950">
          {selectedProjectId ? (
            <>
              <div className="p-4 border-b border-neutral-800 bg-neutral-900">
                <h3 className="font-semibold text-white">{selectedProject?.name} Chat</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isChatLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader className="w-6 h-6 text-violet-500 animate-spin" />
                  </div>
                ) : errorMsg ? (
                  <div className="text-red-400 p-4 bg-red-500/10 rounded-lg text-center">{errorMsg}</div>
                ) : chats.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No messages yet. Start the conversation!</p>
                ) : (
                  chats.map(chat => {
                    const isMe = chat.sender_id === user?.id;
                    return (
                      <div key={chat.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs text-neutral-400">
                            {isMe ? 'You' : chat.sender_name} {chat.sender_role === 'admin' ? '(Admin)' : ''}
                          </span>
                          <span className="text-[10px] text-neutral-500">{formatDate(chat.created_at)}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                          isMe ? 'bg-violet-600 text-white rounded-br-none' : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{chat.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatsEndRef} />
              </div>

              <div className="p-4 bg-neutral-900 border-t border-neutral-800">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:outline-none focus:border-violet-500 text-foreground transition-colors"
                    disabled={isSending || !!errorMsg}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending || !!errorMsg}
                    className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              Select a project to view its chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
