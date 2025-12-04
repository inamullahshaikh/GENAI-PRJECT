import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  Search,
  Loader2,
  Trash2,
  Edit2,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Crown,
  UserMinus,
  X,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { usePagination } from "../../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface EditUserForm {
  username: string;
  name: string;
  email: string;
  role: string;
  dob: string;
  password?: string;
}

interface CreateUserForm {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
  dob: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  dob?: string;
  created_at?: string;
  last_login?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [promoteModal, setPromoteModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    username: "",
    name: "",
    email: "",
    role: "user",
    dob: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "user",
    dob: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter) params.append("role", roleFilter);

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
      pagination.setPaginationData({
        hasMore: data.has_more || false,
        total: data.total || 0,
      });
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      setDeleteModal(null);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const handlePromote = async (userId: string, action: "promote" | "demote") => {
    try {
      const token = localStorage.getItem("accessToken");
      const endpoint = action === "promote" ? "promote" : "demote";
      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      setPromoteModal(null);
      fetchUsers();
    } catch (err: any) {
      alert(`Failed to ${action} user: ` + err.message);
    }
  };

  const handleEditClick = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditForm({
        username: user.username || "",
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        dob: user.dob ? user.dob.split("T")[0] : "",
      });
      setEditModal(userId);
      setEditError(null);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      // Prepare update payload (only include fields that have changed)
      const updates: any = {};
      if (editForm.username) updates.username = editForm.username;
      if (editForm.name) updates.name = editForm.name;
      if (editForm.email) updates.email = editForm.email;
      if (editForm.role) updates.role = editForm.role;
      if (editForm.dob) updates.dob = editForm.dob;
      if (editForm.password) updates.password = editForm.password;

      const response = await fetch(`${API_BASE_URL}/admin/users/${editModal}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update user");
      }

      setEditModal(null);
      setEditForm({
        username: "",
        name: "",
        email: "",
        role: "user",
        dob: "",
        password: "",
      });
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      setCreateError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      if (!createForm.username || !createForm.email || !createForm.password) {
        throw new Error("Username, email, and password are required");
      }

      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: createForm.username,
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          dob: createForm.dob || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to create user");
      }

      setCreateModal(false);
      setCreateForm({
        username: "",
        name: "",
        email: "",
        password: "",
        role: "user",
        dob: "",
      });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const userData = await response.json();
      setViewUser(userData);
      setViewModal(userId);
    } catch (err: any) {
      alert("Failed to fetch user details: " + err.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                User Management
              </h1>
              <p className="text-base text-[var(--color-text-secondary)]">
                Manage all users in the system
              </p>
            </div>
            <button
              onClick={() => {
                setCreateModal(true);
                setCreateError(null);
                setCreateForm({
                  username: "",
                  name: "",
                  email: "",
                  password: "",
                  role: "user",
                  dob: "",
                });
              }}
              className="px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create User
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              />
            </div>
            <select
              value={roleFilter || ""}
              onChange={(e) => setRoleFilter(e.target.value || null)}
              className="px-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              No users found
            </div>
          ) : (
            <>
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[var(--color-surface-secondary)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-primary)]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[var(--color-surface-secondary)]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                                {user.name || user.username}
                              </div>
                              <div className="text-xs text-[var(--color-text-tertiary)]">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--color-text-primary)]">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {user.role === "admin" && <Crown className="w-3 h-3" />}
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewUser(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <UserIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(user.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {user.role !== "admin" ? (
                              <button
                                onClick={() => setPromoteModal(user.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Promote to Admin"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setPromoteModal(user.id)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Demote to User"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteModal(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pagination.prevPage()}
                      disabled={pagination.page === 1}
                      className="p-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-secondary)]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => pagination.nextPage()}
                      disabled={!pagination.hasMore}
                      className="p-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-secondary)]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-red-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  Delete User
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete(deleteModal)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteModal(null)}
                    className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promote/Demote Modal */}
      {promoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-purple-50 rounded-full">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  Change User Role
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {users.find((u) => u.id === promoteModal)?.role === "admin"
                    ? "Demote this user from admin to regular user?"
                    : "Promote this user to administrator?"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handlePromote(
                        promoteModal,
                        users.find((u) => u.id === promoteModal)?.role === "admin"
                          ? "demote"
                          : "promote"
                      )
                    }
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setPromoteModal(null)}
                    className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Edit User
              </h3>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditError(null);
                  setEditForm({
                    username: "",
                    name: "",
                    email: "",
                    role: "user",
                    dob: "",
                  });
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{editError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dob: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  New Password (Optional - leave empty to keep current)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={editForm.password || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </button>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditError(null);
                  setEditForm({
                    username: "",
                    name: "",
                    email: "",
                    role: "user",
                    dob: "",
                  });
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Create New User
              </h3>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateError(null);
                  setCreateForm({
                    username: "",
                    name: "",
                    email: "",
                    password: "",
                    role: "user",
                    dob: "",
                  });
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{createError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] pr-10"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={createForm.dob}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, dob: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={createLoading}
                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </button>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateError(null);
                  setCreateForm({
                    username: "",
                    name: "",
                    email: "",
                    password: "",
                    role: "user",
                    dob: "",
                  });
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewModal && viewUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                User Details
              </h3>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewUser(null);
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Username
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewUser.username || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Full Name
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewUser.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Email
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewUser.email || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Role
                  </label>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      viewUser.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {viewUser.role === "admin" && <Crown className="w-3 h-3" />}
                    {viewUser.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
                {viewUser.dob && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Date of Birth
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {new Date(viewUser.dob).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {viewUser.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Created At
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {new Date(viewUser.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {viewUser.last_login && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Last Login
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {new Date(viewUser.last_login).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    User ID
                  </label>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                    {viewUser.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleEditClick(viewUser.id);
                  setViewModal(null);
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit User
              </button>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewUser(null);
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

