import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import {
  Book,
  Search,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  X,
  Eye,
} from "lucide-react";
import { usePagination } from "../../hooks/usePagination";

const API_BASE_URL = "http://localhost:8000";

interface BookForm {
  title: string;
  author_name: string;
  pages: string;
  status: "processing" | "complete";
}

const BookStatusBadge = ({ status }) => {
  const configs = {
    processing: {
      icon: Loader2,
      text: "Processing",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
      animate: true,
    },
    complete: {
      icon: CheckCircle2,
      text: "Complete",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      iconColor: "text-green-600",
    },
  };

  const config = configs[status] || configs.processing;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${config.bgColor}`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${config.iconColor} ${
          config.animate ? "animate-spin" : ""
        }`}
      />
      <span className={`text-xs font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState<BookForm>({
    title: "",
    author_name: "",
    pages: "",
    status: "processing",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [viewBook, setViewBook] = useState<any>(null);
  const pagination = usePagination({ initialPage: 1, initialLimit: 50 });

  useEffect(() => {
    fetchBooks();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchBooks = async () => {
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

      const response = await fetch(`${API_BASE_URL}/admin/books?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }

      const data = await response.json();
      setBooks(data.books || []);
      pagination.setPaginationData({
        hasMore: data.has_more || false,
        total: data.total || 0,
      });
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      setDeleteModal(null);
      fetchBooks();
    } catch (err) {
      alert("Failed to delete book: " + err.message);
    }
  };

  const handleCreate = async () => {
    try {
      setCreateLoading(true);
      setCreateError(null);

      if (!bookForm.title) {
        throw new Error("Title is required");
      }

      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/books/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: bookForm.title,
          author_name: bookForm.author_name || undefined,
          pages: bookForm.pages ? parseInt(bookForm.pages) : undefined,
          status: bookForm.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to create book");
      }

      setCreateModal(false);
      setBookForm({
        title: "",
        author_name: "",
        pages: "",
        status: "processing",
      });
      fetchBooks();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create book");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClick = (bookId: string) => {
    const book = books.find((b: any) => b.id === bookId);
    if (book) {
      setBookForm({
        title: book.title || "",
        author_name: book.author_name || "",
        pages: book.pages?.toString() || "",
        status: book.status || "processing",
      });
      setEditModal(bookId);
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
      if (bookForm.title) updates.title = bookForm.title;
      if (bookForm.author_name) updates.author_name = bookForm.author_name;
      if (bookForm.pages) updates.pages = parseInt(bookForm.pages);
      if (bookForm.status) updates.status = bookForm.status;

      const response = await fetch(`${API_BASE_URL}/admin/books/${editModal}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update book");
      }

      setEditModal(null);
      setBookForm({
        title: "",
        author_name: "",
        pages: "",
        status: "processing",
      });
      fetchBooks();
    } catch (err: any) {
      setEditError(err.message || "Failed to update book");
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewBook = async (bookId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/admin/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch book details");
      }

      const bookData = await response.json();
      setViewBook(bookData);
      setViewModal(bookId);
    } catch (err: any) {
      alert("Failed to fetch book details: " + err.message);
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
                Book Management
              </h1>
              <p className="text-base text-[var(--color-text-secondary)]">
                Manage all books in the system
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchBooks}
                disabled={loading}
                className="px-4 py-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition-all flex items-center gap-2 border border-[var(--color-border-primary)]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => {
                  setCreateModal(true);
                  setCreateError(null);
                  setBookForm({
                    title: "",
                    author_name: "",
                    pages: "",
                    status: "processing",
                  });
                }}
                className="px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Book
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search books..."
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
              <option value="processing">Processing</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {/* Books Grid */}
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
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              No books found
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book: any) => (
                  <div
                    key={book.id}
                    className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] line-clamp-2 mb-2">
                          {book.title || "Untitled Book"}
                        </h3>
                        {book.author_name && (
                          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                            {book.author_name}
                          </p>
                        )}
                      </div>
                      <BookStatusBadge status={book.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      {book.pages && (
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                          {book.pages} pages
                        </div>
                      )}
                      {book.uploaded_at && (
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          Uploaded: {new Date(book.uploaded_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewBook(book.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(book.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal(book.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
                    {pagination.total} books
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
                  Delete Book
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Are you sure you want to delete this book? This will notify all users who uploaded it. This action cannot be undone.
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

      {/* Create Book Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Create New Book
              </h3>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateError(null);
                  setBookForm({
                    title: "",
                    author_name: "",
                    pages: "",
                    status: "processing",
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
                  value={bookForm.title}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Book Title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Author Name
                </label>
                <input
                  type="text"
                  value={bookForm.author_name}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, author_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Author Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Pages
                </label>
                <input
                  type="number"
                  value={bookForm.pages}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, pages: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Number of pages"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Status
                </label>
                <select
                  value={bookForm.status}
                  onChange={(e) =>
                    setBookForm({
                      ...bookForm,
                      status: e.target.value as "processing" | "complete",
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="processing">Processing</option>
                  <option value="complete">Complete</option>
                </select>
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
                  "Create Book"
                )}
              </button>
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateError(null);
                  setBookForm({
                    title: "",
                    author_name: "",
                    pages: "",
                    status: "processing",
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

      {/* Edit Book Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Edit Book
              </h3>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditError(null);
                  setBookForm({
                    title: "",
                    author_name: "",
                    pages: "",
                    status: "processing",
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
                  value={bookForm.title}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Book Title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Author Name
                </label>
                <input
                  type="text"
                  value={bookForm.author_name}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, author_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Author Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Pages
                </label>
                <input
                  type="number"
                  value={bookForm.pages}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, pages: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                  placeholder="Number of pages"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Status
                </label>
                <select
                  value={bookForm.status}
                  onChange={(e) =>
                    setBookForm({
                      ...bookForm,
                      status: e.target.value as "processing" | "complete",
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                >
                  <option value="processing">Processing</option>
                  <option value="complete">Complete</option>
                </select>
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
                  "Update Book"
                )}
              </button>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditError(null);
                  setBookForm({
                    title: "",
                    author_name: "",
                    pages: "",
                    status: "processing",
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

      {/* View Book Modal */}
      {viewModal && viewBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Book Details
              </h3>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewBook(null);
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
                    Title
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewBook.title || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Author
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewBook.author_name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Pages
                  </label>
                  <p className="text-base text-[var(--color-text-primary)]">
                    {viewBook.pages || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Status
                  </label>
                  <BookStatusBadge status={viewBook.status} />
                </div>
                {viewBook.uploaded_at && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Uploaded At
                    </label>
                    <p className="text-base text-[var(--color-text-primary)]">
                      {new Date(viewBook.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {viewBook.uploader_id && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Uploader ID
                    </label>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                      {viewBook.uploader_id}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Book ID
                  </label>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-mono">
                    {viewBook.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  handleEditClick(viewBook.id);
                  setViewModal(null);
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Book
              </button>
              <button
                onClick={() => {
                  setViewModal(null);
                  setViewBook(null);
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

