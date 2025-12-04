import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Plus,
  Eye,
} from "lucide-react";
import { usePagination } from "../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface Feedback {
  id: string;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  admin_response?: string;
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

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 });

  useEffect(() => {
    fetchFeedbacks();
  }, [pagination.page]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/feedback/me?page=${pagination.page}&limit=${pagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      setSubmitError("Subject and message are required");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(`${API_BASE_URL}/feedback/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to submit feedback");
      }

      setSubmitSuccess(true);
      setFormData({ subject: "", message: "" });
      setTimeout(() => {
        setCreateModal(false);
        setSubmitSuccess(false);
        fetchFeedbacks();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewFeedback = async (feedbackId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                Feedback & Suggestions
              </h1>
              <p className="text-base text-[var(--color-text-secondary)]">
                Share your feedback, suggestions, or report issues
              </p>
            </div>
            <button
              onClick={() => {
                setCreateModal(true);
                setSubmitError(null);
                setSubmitSuccess(false);
                setFormData({ subject: "", message: "" });
              }}
              className="px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Submit Feedback
            </button>
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
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No feedback submitted yet
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Click "Submit Feedback" to share your thoughts with us
              </p>
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
                          <span>{formatDate(feedback.created_at)}</span>
                          {feedback.admin_response && (
                            <span className="text-green-600">✓ Responded</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewFeedback(feedback.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
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

      {/* Create Feedback Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Submit Feedback
              </h3>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setSubmitError(null);
                  setSubmitSuccess(false);
                  setFormData({ subject: "", message: "" });
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">Feedback submitted successfully!</p>
              </div>
            )}

            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Brief description of your feedback"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                  placeholder="Please provide details about your feedback, suggestion, or issue..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setSubmitError(null);
                  setSubmitSuccess(false);
                  setFormData({ subject: "", message: "" });
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Submitted: {formatDate(viewFeedback.created_at)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Your Message
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

              {!viewFeedback.admin_response && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your feedback is being reviewed. You will receive a response soon.
                  </p>
                </div>
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
    </div>
  );
}

