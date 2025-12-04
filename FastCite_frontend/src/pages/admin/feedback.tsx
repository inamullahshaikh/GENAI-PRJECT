import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  MessageSquare,
  Search,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Eye,
  Send,
  Filter,
} from "lucide-react";
import { usePagination } from "../../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface Feedback {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { icon: any; text: string; bgColor: string; textColor: string }> = {
    pending: {
      icon: Clock,
      text: "Pending",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    in_progress: {
      icon: Loader2,
      text: "In Progress",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    resolved: {
      icon: CheckCircle2,
      text: "Resolved",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    closed: {
      icon: X,
      text: "Closed",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
    },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${config.bgColor}`}>
      <Icon className={`w-3.5 h-3.5 ${config.textColor} ${status === "in_progress" ? "animate-spin" : ""}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>
    </div>
  );
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [respondModal, setRespondModal] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  useEffect(() => {
    fetchFeedbacks();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchFeedbacks = async () => {
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
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`${API_BASE_URL}/admin/feedback?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback");
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
      pagination.setPaginationData({
        hasMore: data.has_more || false,
        total: data.total || 0,
      });
    } catch (err: any) {
      console.error("Error fetching feedback:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = async (feedbackId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/feedback/${feedbackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback details");
      }

      const feedbackData = await response.json();
      setViewFeedback(feedbackData);
      setViewModal(feedbackId);
    } catch (err: any) {
      alert("Failed to fetch feedback details: " + err.message);
    }
  };

  const handleRespond = async () => {
    if (!respondModal || !responseText.trim()) {
      setResponseError("Response text is required");
      return;
    }

    try {
      setResponding(true);
      setResponseError(null);

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/feedback/${respondModal}/respond`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response: responseText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to respond to feedback");
      }

      setRespondModal(null);
      setResponseText("");
      fetchFeedbacks();
    } catch (err: any) {
      setResponseError(err.message || "Failed to respond to feedback");
    } finally {
      setResponding(false);
    }
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/feedback/${feedbackId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      fetchFeedbacks();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/feedback/${feedbackId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete feedback");
      }

      setDeleteModal(null);
      fetchFeedbacks();
    } catch (err: any) {
      alert("Failed to delete feedback: " + err.message);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              Feedback Management
            </h1>
            <p className="text-base text-[var(--color-text-secondary)]">
              View and respond to user feedback and suggestions
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              />
            </div>
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Feedback List */}
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
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              No feedback found
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {feedback.subject}
                          </h3>
                          <StatusBadge status={feedback.status} />
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                          {feedback.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
                          <span>From: {feedback.user_name || feedback.user_email || feedback.user_id}</span>
                          <span>{formatDate(feedback.created_at)}</span>
                          {feedback.admin_response && (
                            <span className="text-green-600">✓ Responded</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewFeedback(feedback.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {!feedback.admin_response && (
                          <button
                            onClick={() => {
                              setRespondModal(feedback.id);
                              setResponseText("");
                              setResponseError(null);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Respond"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal(feedback.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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
                    {pagination.total} feedbacks
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => pagination.prevPage()}
                      disabled={pagination.page === 1}
                      className="p-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-secondary)]"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => pagination.nextPage()}
                      disabled={!pagination.hasMore}
                      className="p-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-secondary)]"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Feedback Modal */}
      {viewModal && viewFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Feedback Details
              </h3>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewFeedback(null);
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {viewFeedback.subject}
                  </h4>
                  <StatusBadge status={viewFeedback.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-[var(--color-text-secondary)]">
                  <div>
                    <span className="font-medium">User:</span> {viewFeedback.user_name || viewFeedback.user_email || viewFeedback.user_id}
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span> {formatDate(viewFeedback.created_at)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Message
                </label>
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4">
                  <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                    {viewFeedback.message}
                  </p>
                </div>
              </div>

              {viewFeedback.admin_response && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Admin Response
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-900 whitespace-pre-wrap">
                      {viewFeedback.admin_response}
                    </p>
                    {viewFeedback.responded_at && (
                      <p className="text-xs text-green-700 mt-2">
                        Responded: {formatDate(viewFeedback.responded_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Status
                </label>
                <select
                  value={viewFeedback.status}
                  onChange={(e) => {
                    handleStatusUpdate(viewFeedback.id, e.target.value);
                    setViewFeedback({ ...viewFeedback, status: e.target.value as any });
                  }}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {!viewFeedback.admin_response && (
                <button
                  onClick={() => {
                    setViewModal(null);
                    setRespondModal(viewFeedback.id);
                    setResponseText("");
                    setResponseError(null);
                  }}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Respond to Feedback
                </button>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewFeedback(null);
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {respondModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Respond to Feedback
              </h3>
              <button
                onClick={() => {
                  setRespondModal(null);
                  setResponseText("");
                  setResponseError(null);
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {responseError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{responseError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                  placeholder="Type your response to the user..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleRespond}
                disabled={responding || !responseText.trim()}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {responding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Responding...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Response
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setRespondModal(null);
                  setResponseText("");
                  setResponseError(null);
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Delete Feedback
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Are you sure you want to delete this feedback? This action cannot be undone.
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
    </div>
  );
}

