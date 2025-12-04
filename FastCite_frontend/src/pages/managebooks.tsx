import React, { useState, useEffect } from "react";
import {
  Book,
  Trash2,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  X,
  Calendar,
  User,
  FileText,
  Home,
  Upload,
  Library,
  MessageSquare,
  Edit2,
  Check,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = "http://localhost:8000";
import Sidebar from "../components/Sidebar";
import { usePagination } from "../hooks/usePagination";

/**
 * Book Status Badge
 */
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

/**
 * Delete Confirmation Modal
 */
const DeleteModal = ({ book, onConfirm, onCancel, isDeleting }) => {
  return (
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
              Are you sure you want to delete "<strong>{book.title || "Untitled Book"}</strong>"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Book Card Component
 */
const BookCard = ({ book, onDelete, onUpdateName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(book.title || "Untitled Book");
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canDelete = book.status === "complete";

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(book.title || "Untitled Book");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(book.title || "Untitled Book");
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdateName(book.id, editedName.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating book name:", err);
      setEditedName(book.title || "Untitled Book");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-[var(--color-accent-primary)]/10 rounded-lg">
          <Book className="w-6 h-6 text-[var(--color-accent-primary)]" />
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isUpdating}
                className="flex-1 px-3 py-1.5 bg-[var(--color-surface-secondary)] border border-[var(--color-accent-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] text-base font-semibold"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={isUpdating || !editedName.trim()}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] line-clamp-2 flex-1">
                {book.title || "Untitled Book"}
              </h3>
              <button
                onClick={handleEdit}
                className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 rounded-lg transition-all flex-shrink-0"
                title="Edit book name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="space-y-2 mb-3">
            {book.author_name && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span className="truncate">{book.author_name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span>{formatDate(book.uploaded_at)}</span>
            </div>
            
            {book.pages && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <span>{book.pages} pages</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <BookStatusBadge status={book.status} />
            
            <button
              onClick={() => onDelete(book)}
              disabled={!canDelete}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                canDelete
                  ? "text-red-600 hover:bg-red-50 border border-red-200"
                  : "text-[var(--color-text-tertiary)] cursor-not-allowed opacity-50"
              }`}
              title={!canDelete ? "Only completed books can be deleted" : "Delete book"}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Success/Error Toast
 */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md ${
        isError ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
      } border rounded-xl p-4 shadow-lg flex items-start gap-3`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      )}
      <p className={`text-sm flex-1 ${isError ? "text-red-700" : "text-green-700"}`}>
        {message}
      </p>
      <button onClick={onClose} className={isError ? "text-red-400 hover:text-red-600" : "text-green-400 hover:text-green-600"}>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

/**
 * Main Manage Books Page
 */
export default function ManageBooksPage() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 });

  // Fetch books with pagination
  const fetchBooks = async (page = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        setToast({ message: "Please log in to view your books", type: "error" });
        navigate("/login")
        return;
      }

      const response = await fetch(`${API_BASE_URL}/books/me?page=${page}&limit=${pagination.limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }

      const data = await response.json();
      
      // Update pagination state
      pagination.setPaginationData({
        hasMore: data.has_more,
        total: data.total,
      });
      
      if (append) {
        setBooks((prev) => [...prev, ...(data.books || [])]);
        setFilteredBooks((prev) => [...prev, ...(data.books || [])]);
      } else {
        setBooks(data.books || []);
        setFilteredBooks(data.books || []);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setToast({ message: "Failed to load books", type: "error" });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchBooks(pagination.page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const loadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      const nextPage = pagination.page + 1;
      pagination.setPage(nextPage);
      fetchBooks(nextPage, true);
    }
  };

  // Debounced search effect - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      filterBooks(searchTerm, statusFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, books]);

  const filterBooks = (search, status) => {
    let filtered = [...books];

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          (book.title && book.title.toLowerCase().includes(searchLower)) ||
          (book.author_name && book.author_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter((book) => book.status === status);
    }

    setFilteredBooks(filtered);
  };

  const handleDeleteClick = (book) => {
    if (book.status === "complete") {
      setBookToDelete(book);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE_URL}/pdf/${bookToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      setToast({ 
        message: `"${bookToDelete.title || "Book"}" deletion started successfully`, 
        type: "success" 
      });

      // Remove book from local state
      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setFilteredBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      
      setBookToDelete(null);
    } catch (err) {
      console.error("Error deleting book:", err);
      setToast({ message: "Failed to delete book", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateBookName = async (bookId, newName) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(`${API_BASE_URL}/books/${bookId}/my-name`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ book_name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update book name");
      }

      // Update local state
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, title: newName } : b))
      );
      setFilteredBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, title: newName } : b))
      );

      setToast({
        message: "Book name updated successfully",
        type: "success",
      });
    } catch (err) {
      console.error("Error updating book name:", err);
      setToast({
        message: err.message || "Failed to update book name",
        type: "error",
      });
      throw err;
    }
  };

  const stats = {
    total: books.length,
    complete: books.filter((b) => b.status === "complete").length,
    processing: books.filter((b) => b.status === "processing").length,
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                Manage Books
              </h1>
              <p className="text-base text-[var(--color-text-secondary)]">
                View and manage your uploaded PDF documents
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/upload")}
                className="px-5 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-primary)]/90 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                title="Upload new PDF"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Upload PDF</span>
                <span className="sm:hidden">Upload</span>
              </button>
              <button
                onClick={() => fetchBooks(1, false)}
                disabled={loading}
                className="px-4 py-2.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] rounded-xl font-medium hover:bg-[var(--color-surface-hover)] disabled:opacity-50 transition-all flex items-center gap-2 border border-[var(--color-border-primary)]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Book className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-tertiary)]">Total Books</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-tertiary)]">Complete</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.complete}</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-tertiary)]">Processing</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.processing}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:border-transparent cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="complete">Complete</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
            </div>
          ) : filteredBooks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBooks.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onDelete={handleDeleteClick}
                    onUpdateName={handleUpdateBookName}
                  />
                ))}
              </div>
              {!searchTerm && statusFilter === "all" && pagination.hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More ({pagination.total - filteredBooks.length} remaining)
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-12 text-center">
              <Book className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {searchTerm || statusFilter !== "all" ? "No books found" : "No books yet"}
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first PDF to get started"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <button
                  onClick={() => navigate("/upload")}
                  className="px-6 py-3 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-primary)]/90 transition-all flex items-center gap-2 mx-auto shadow-md hover:shadow-lg"
                >
                  <Upload className="w-5 h-5" />
                  Upload Your First PDF
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <DeleteModal
          book={bookToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setBookToDelete(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}