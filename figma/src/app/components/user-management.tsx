import { useEffect, useState } from "react";
import { Users, Shield, Search, Loader, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";
import { fetchAllUsers, updateUserRole, AuthUserResponse, UserRole } from "@/app/lib/api";

export function UserManagement() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<AuthUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  useEffect(() => {
    if (token && user?.role === "admin") {
      loadUsers();
    }
  }, [token, user]);

  const loadUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchAllUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    if (!token || userId === user?.id) return;
    
    setUpdatingUser(userId);
    try {
      await updateUserRole(token, userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.roll_number?.toLowerCase().includes(query) ||
      u.department?.toLowerCase().includes(query)
    );
  });

  if (!token || user?.role !== "admin") {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-200">Access Denied</h2>
        <p className="text-gray-400 mt-3">Only admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-black to-neutral-950 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
          <Users className="w-8 h-8 text-violet-500" />
          User Management
        </h2>
        <p className="text-neutral-400 mt-2">
          View and manage all registered users
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-white">×</button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search users by name, email, roll number, or department..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <p className="text-neutral-400 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <p className="text-neutral-400 text-sm">Admins</p>
          <p className="text-2xl font-bold text-violet-400">{users.filter(u => u.role === "admin").length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
          <p className="text-neutral-400 text-sm">Members</p>
          <p className="text-2xl font-bold text-green-400">{users.filter(u => u.role === "member").length}</p>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-400">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900/50 rounded-lg border border-neutral-700">
          <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">No users found.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Contact</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Roll No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">Role</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                          {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.full_name || "No name"}</p>
                          <p className="text-neutral-500 text-xs">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-neutral-300 text-sm">{u.email || "-"}</p>
                      <p className="text-neutral-500 text-xs">{u.phone || "-"}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-neutral-300 text-sm capitalize">{u.department || "-"}</span>
                      {u.branch && <span className="text-neutral-500 text-xs block">{u.branch}</span>}
                    </td>
                    <td className="py-3 px-4 text-neutral-300 text-sm">{u.roll_number || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === "admin" ? "bg-violet-500/20 text-violet-400" : "bg-green-500/20 text-green-400"
                      }`}>
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id === user?.id ? (
                        <span className="text-neutral-500 text-xs">(You)</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {updatingUser === u.id ? (
                            <Loader className="w-4 h-4 animate-spin text-violet-500" />
                          ) : (
                            <>
                              {u.role === "member" ? (
                                <button
                                  onClick={() => handleRoleChange(u.id, "admin")}
                                  className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30 transition-colors text-xs"
                                  title="Promote to Admin"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Make Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRoleChange(u.id, "member")}
                                  className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors text-xs"
                                  title="Demote to Member"
                                >
                                  <UserX className="w-3 h-3" />
                                  Make Member
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
