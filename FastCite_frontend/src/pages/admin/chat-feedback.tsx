import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { usePagination } from "../../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface ChatFeedbackItem {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  chat_session_id: string;
  message_index: number;
  rating: "positive" | "negative" | "neutral";
  star_rating?: number | null;
  comment: string | null;
  question: string;
  answer: string;
  created_at: string;
}

const RatingBadge = ({ rating }: { rating: string }) => {
  const colors = {
    positive: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    negative: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    neutral: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  };

  const icons = {
    positive: ThumbsUp,
    negative: ThumbsDown,
    neutral: MessageSquare,
  };

  const Icon = icons[rating as keyof typeof icons];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
        colors[rating as keyof typeof colors]
      }`}
    >
      <Icon className="w-3 h-3" />
      {rating.charAt(0).toUpperCase() + rating.slice(1)}
    </span>
  );
};

const StarRating = ({ rating }: { rating: number | null | undefined }) => {
  if (!rating || rating < 1 || rating > 5) return null;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-[var(--color-text-secondary)] ml-1">
        ({rating}/5)
      </span>
    </div>
  );
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

export default function AdminChatFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<ChatFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<ChatFeedbackItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 });

  useEffect(() => {
    fetchFeedbacks();
  }, [pagination.page, ratingFilter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (ratingFilter) {
        params.append("rating", ratingFilter);
      }

      const response = await fetch(
        `${API_BASE_URL}/chat-feedback/admin/all?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch chat feedback");
      }

      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
      pagination.setPaginationData({
        total: data.total || 0,
        hasMore: data.has_more || false,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load chat feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    setDeleting(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/chat-feedback/${feedbackId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete feedback");
      }

      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
      setDeleteModal(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete feedback");
    } finally {
      setDeleting(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      !searchTerm ||
      feedback.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              Chat Feedback
            </h1>
            <p className="text-base text-[var(--color-text-secondary)]">
              View user feedback on LLM chat responses
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search by user, question, answer, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
              />
            </div>
            <select
              value={ratingFilter || ""}
              onChange={(e) => setRatingFilter(e.target.value || null)}
              className="px-4 py-2.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
            >
              <option value="">All Ratings</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Feedback List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 rounded-xl p-6 flex items-start gap-3">
              <MessageSquare className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">Error</h3>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No chat feedback found
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {searchTerm || ratingFilter
                  ? "Try adjusting your search or filters"
                  : "User feedback on chat responses will appear here"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <RatingBadge rating={feedback.rating} />
                          {feedback.star_rating && (
                            <StarRating rating={feedback.star_rating} />
                          )}
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            Message #{feedback.message_index + 1}
                          </span>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                            Question:
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                            {feedback.question}
                          </p>
                        </div>
                        {feedback.comment && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                              Comment:
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                              {feedback.comment}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
                          <span>
                            {feedback.user_name || feedback.user_email || feedback.user_id}
                          </span>
                          <span>{formatDate(feedback.created_at)}</span>
                          <span>Chat: {feedback.chat_session_id.substring(0, 8)}...</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewModal(feedback)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(feedback.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
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

      {/* View Feedback Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Feedback Details
              </h3>
              <button
                onClick={() => setViewModal(null)}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <RatingBadge rating={viewModal.rating} />
                {viewModal.star_rating && (
                  <StarRating rating={viewModal.star_rating} />
                )}
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Message #{viewModal.message_index + 1} in Chat {viewModal.chat_session_id.substring(0, 8)}...
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  User
                </label>
                <p className="text-base text-[var(--color-text-primary)]">
                  {viewModal.user_name || viewModal.user_email || viewModal.user_id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Question
                </label>
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4">
                  <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                    {viewModal.question}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  LLM Response
                </label>
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                    {viewModal.answer}
                  </p>
                </div>
              </div>

              {viewModal.comment && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    User Comment
                  </label>
                  <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-4">
                    <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {viewModal.comment}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Submitted
                </label>
                <p className="text-sm text-[var(--color-text-primary)]">
                  {formatDate(viewModal.created_at)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setViewModal(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Close
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
              <div className="flex-shrink-0 p-3 bg-red-500/10 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
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

