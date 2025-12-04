import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  MessageSquare,
  Search,
  Loader2,
  Trash2,
  AlertCircle,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  X,
  Eye,
} from "lucide-react";
import { usePagination } from "../../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface ChatForm {
  title: string;
  user_id: string;
}

interface ChatMessage {
  question?: string;
  answer?: string;
  role?: string;
  content?: string;
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [chatForm, setChatForm] = useState<ChatForm>({
    title: "",
    user_id: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [viewChat, setViewChat] = useState<any>(null);
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  useEffect(() => {
    fetchChats();
  }, [pagination.page, searchTerm]);

  const fetchChats = async () => {
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

      const response = await fetch(`${API_BASE_URL}/admin/chats?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const data = await response.json();
      setChats(data.chats || []);
      pagination.setPaginationData({
        hasMore: data.has_more || false,
        total: data.total || 0,
      });
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      setDeleteModal(null);
      fetchChats();
    } catch (err) {
      alert("Failed to delete chat: " + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      setCreateError(null);

      if (!chatForm.title) {
        throw new Error("Title is required");
      }

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/chats/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: chatForm.title,
          user_id: chatForm.user_id || undefined,
          messages: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to create chat");
      }

      setCreateModal(false);
      setChatForm({
        title: "",
        user_id: "",
      });
      fetchChats();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create chat");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClick = (chatId: string) => {
    const chat = chats.find((c: any) => c.id === chatId);
    if (chat) {
      setChatForm({
        title: chat.title || "",
        user_id: chat.user_id || "",
      });
      setEditModal(chatId);
      setEditError(null);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const token = localStorage.getItem("accessToken");
      const updates: any = {};
      if (chatForm.title) updates.title = chatForm.title;
      if (chatForm.user_id) updates.user_id = chatForm.user_id;

      const response = await fetch(`${API_BASE_URL}/admin/chats/${editModal}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update chat");
      }

      setEditModal(null);
      setChatForm({
        title: "",
        user_id: "",
      });
      fetchChats();
    } catch (err: any) {
      setEditError(err.message || "Failed to update chat");
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewChat = async (chatId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat details");
      }

      const chatData = await response.json();
      setViewChat(chatData);
      setViewModal(chatId);
    } catch (err: any) {
      alert("Failed to fetch chat details: " + err.message);
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
                Chat Management
              </h1>
              <p className="text-base text-[var(--color-text-secondary)]">
                Manage all chat sessions in the system
              </p>
            </div>
            <button
              onClick={() => {
                setCreateModal(true);
                setCreateError(null);
                setChatForm({
                  title: "",
                  user_id: "",
                });
              }}
              className="px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Chat
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              />
            </div>
          </div>

          {/* Chats List */}
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
          ) : chats.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              No chats found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {chats.map((chat: any) => (
                  <div
                    key={chat.id}
                    className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                          {chat.title || "Untitled Chat"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mb-3">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            <span>
                              {chat.messages?.length || 0} messages
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(chat.created_at)}</span>
                          </div>
                        </div>
                        {chat.user_id && (
                          <div className="text-xs text-[var(--color-text-tertiary)]">
                            User ID: {chat.user_id}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewChat(chat.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(chat.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Chat"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(chat.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} chats
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
                  Delete Chat
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Are you sure you want to delete this chat? This action cannot be undone.
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

      {/* Create Chat Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Create New Chat
              </h3>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateError(null);
                  setChatForm({
                    title: "",
                    user_id: "",
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
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={chatForm.title}
                  onChange={(e) =>
                    setChatForm({ ...chatForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Chat Title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  User ID (Optional)
                </label>
                <input
                  type="text"
                  value={chatForm.user_id}
                  onChange={(e) =>
                    setChatForm({ ...chatForm, user_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="User ID"
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
                  "Create Chat"
                )}
              </button>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateError(null);
                  setChatForm({
                    title: "",
                    user_id: "",
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

      {/* Edit Chat Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Edit Chat
              </h3>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditError(null);
                  setChatForm({
                    title: "",
                    user_id: "",
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
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={chatForm.title}
                  onChange={(e) =>
                    setChatForm({ ...chatForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Chat Title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={chatForm.user_id}
                  onChange={(e) =>
                    setChatForm({ ...chatForm, user_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="User ID"
                />
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
                  "Update Chat"
                )}
              </button>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditError(null);
                  setChatForm({
                    title: "",
                    user_id: "",
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

      {/* View Chat Modal */}
      {viewModal && viewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Chat Details
              </h3>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewChat(null);
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Title
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewChat.title || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    User ID
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewChat.user_id || "N/A"}
                  </p>
                </div>
                {viewChat.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Created At
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {formatDate(viewChat.created_at)}
                    </p>
                  </div>
                )}
                {viewChat.updated_at && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Updated At
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {formatDate(viewChat.updated_at)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Chat ID
                  </label>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                    {viewChat.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Messages Count
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewChat.messages?.length || 0}
                  </p>
                </div>
              </div>

              {viewChat.messages && viewChat.messages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                    Messages
                  </label>
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {viewChat.messages.map((message: ChatMessage, index: number) => (
                      <div
                        key={index}
                        className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4"
                      >
                        {message.question && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-blue-600">Question:</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-1">
                              {message.question}
                            </p>
                          </div>
                        )}
                        {message.answer && (
                          <div>
                            <span className="text-xs font-medium text-green-600">Answer:</span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-1">
                              {message.answer}
                            </p>
                          </div>
                        )}
                        {message.content && (
                          <div>
                            <span className="text-xs font-medium text-purple-600">
                              {message.role === "user" ? "User" : "Assistant"}:
                            </span>
                            <p className="text-sm text-[var(--color-text-primary)] mt-1">
                              {message.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleEditClick(viewChat.id);
                  setViewModal(null);
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Chat
              </button>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewChat(null);
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

