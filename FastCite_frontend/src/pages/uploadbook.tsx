import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  FileCheck,
  Book,
  User,
  Calendar,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
const API_BASE_URL = "http://localhost:8000";
import { useNavigate } from "react-router-dom";

/**
 * Status badge component for upload tasks
 */
const StatusBadge = ({ status }) => {
  const configs = {
    PENDING: {
      icon: Clock,
      text: "Pending",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-600",
    },
    STARTED: {
      icon: Loader2,
      text: "Processing",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      iconColor: "text-blue-600",
      animate: true,
    },
    SUCCESS: {
      icon: CheckCircle2,
      text: "Success",
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      iconColor: "text-green-600",
    },
    FAILURE: {
      icon: XCircle,
      text: "Failed",
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      iconColor: "text-red-600",
    },
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}
    >
      <Icon
        className={`w-4 h-4 ${config.iconColor} ${
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
 * Book status badge component
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
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bgColor}`}
    >
      <Icon
        className={`w-3 h-3 ${config.iconColor} ${
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
 * Upload task card component
 */
const UploadTaskCard = ({ task, onRefresh }) => {
  return (
    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 p-2 bg-[var(--color-accent-primary)]/10 rounded-lg mt-0.5">
            <FileText className="w-5 h-5 text-[var(--color-accent-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-[var(--color-text-primary)] truncate mb-1">
              {task.filename}
            </h4>
            <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
              Task ID: {task.task_id}
            </p>
            <StatusBadge status={task.status} />
          </div>
        </div>
        {(task.status === "PENDING" || task.status === "STARTED") && (
          <button
            onClick={onRefresh}
            className="text-xs text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]/80 font-medium transition-colors"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Book card component
 */
const BookCard = ({ book }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 bg-[var(--color-accent-primary)]/10 rounded">
          <Book className="w-4 h-4 text-[var(--color-accent-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate mb-0.5">
            {book.title || "Untitled Book"}
          </h3>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
            {book.author_name && <span className="truncate">{book.author_name}</span>}
            <span>•</span>
            <span>{formatDate(book.uploaded_at)}</span>
            {book.pages && (
              <>
                <span>•</span>
                <span>{book.pages}p</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <BookStatusBadge status={book.status} />
        </div>
      </div>
    </div>
  );
};
/**
 * Error message component
 */
const ErrorMessage = ({ message, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-red-700">{message}</p>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 transition-colors"
      >
        <XCircle className="w-5 h-5" />
      </button>
    )}
  </div>
);

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadTasks, setUploadTasks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showBookNamePrompt, setShowBookNamePrompt] = useState(false);
  const [pendingTaskForBookName, setPendingTaskForBookName] = useState(null);
  const [bookNameInput, setBookNameInput] = useState("");
  const navigate = useNavigate();
  // Fetch user's books
  useEffect(() => {
    fetchMyBooks();
  }, []);

  // Check task status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingTasks = uploadTasks.filter(
        (task) => task.status === "PENDING" || task.status === "STARTED"
      );

      if (pendingTasks.length > 0) {
        pendingTasks.forEach((task) => {
          checkTaskStatus(task.task_id);
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadTasks]);

  const fetchMyBooks = async () => {
    try {
      setLoadingBooks(true);
      const token = localStorage.getItem("accessToken");
      if (!token){
        navigate("/login")
      }
      const response = await fetch(`${API_BASE_URL}/books/me?page=1&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        setMyBooks(data.books || []);
        console.log(data);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const checkTaskStatus = async (taskId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/pdf/task/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUploadTasks((prev) => {
          const updated = prev.map((task) =>
            task.task_id === taskId ? { ...task, status: data.status } : task
          );
          
          // Check if task failed due to missing book name
          if (data.status === "FAILURE" && data.result) {
            const errorMessage = typeof data.result === 'string' 
              ? data.result 
              : (data.result.error || (typeof data.result === 'object' ? JSON.stringify(data.result) : String(data.result)));
            
            if (errorMessage && (
                errorMessage.includes("Book name is required") || 
                errorMessage.includes("PDF metadata does not contain a valid title") ||
                errorMessage.includes("Please provide 'book_name' parameter"))) {
              // Find the task to get the filename
              const task = updated.find(t => t.task_id === taskId);
              if (task && !pendingTaskForBookName) {
                setPendingTaskForBookName({ taskId, filename: task.filename });
                setShowBookNamePrompt(true);
              }
            }
          }
          
          // Clear selected file when task succeeds
          if (data.status === "SUCCESS") {
            const completedTask = updated.find(t => t.task_id === taskId);
            if (completedTask) {
              setSelectedFiles((currentFiles) => {
                return currentFiles.filter(file => file.name !== completedTask.filename);
              });
            }
            fetchMyBooks();
          }
          
          return updated;
        });
      }
    } catch (err) {
      console.error("Error checking task status:", err);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const pdfFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf") {
        pdfFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(`Invalid file(s): ${invalidFiles.join(", ")}. Please select PDF files only.`);
    } else {
      setError(null);
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles((prev) => {
        // Avoid duplicates by checking file name and size
        const existingNames = new Set(prev.map(f => `${f.name}-${f.size}`));
        const newFiles = pdfFiles.filter(f => !existingNames.has(`${f.name}-${f.size}`));
        return [...prev, ...newFiles];
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleUpload = async (bookName = null, fileToUpload: File | null = null) => {
    const filesToUpload = fileToUpload ? [fileToUpload] : selectedFiles;
    
    if (filesToUpload.length === 0) {
      setError("Please select at least one file first");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      // Upload files sequentially to avoid overwhelming the server
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        if (bookName) {
          formData.append("book_name", bookName);
        }

        const response = await fetch(`${API_BASE_URL}/pdf/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }
          const errorData = await response.json();
          throw new Error(errorData.detail || `Upload failed for ${file.name}`);
        }

        const data = await response.json();

        // Add to upload tasks
        const newTask = {
          task_id: data.task_id,
          filename: data.filename,
          status: "PENDING",
        };
        
        setUploadTasks((prev) => [newTask, ...prev]);
      }

      // Clear selected files if we provided a book name (re-upload scenario)
      // Otherwise keep them in case we need to re-upload with book name
      if (bookName) {
        if (fileToUpload) {
          setSelectedFiles((prev) => prev.filter(f => f.name !== fileToUpload.name));
        } else {
          setSelectedFiles([]);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file(s)");

      if (
        err.message.includes("log in again") ||
        err.message.includes("expired")
      ) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    } finally {
      setUploading(false);
    }
  };

  const handleBookNameSubmit = async () => {
    if (!bookNameInput.trim()) {
      setError("Please enter a book name");
      return;
    }

    if (!pendingTaskForBookName) {
      setError("No pending task found");
      return;
    }

    // Remove the failed task from the list
    setUploadTasks((prev) =>
      prev.filter((task) => task.task_id !== pendingTaskForBookName.taskId)
    );

    // Close the prompt
    setShowBookNamePrompt(false);
    const bookName = bookNameInput.trim();
    setBookNameInput("");
    setPendingTaskForBookName(null);

    // Re-upload with the book name
    const fileToReupload = selectedFiles.find(f => f.name === pendingTaskForBookName.filename);
    if (fileToReupload) {
      await handleUpload(bookName, fileToReupload);
    } else {
      await handleUpload(bookName);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-8 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                Upload PDF
              </h1>
              <p className="text-base text-[var(--color-text-secondary)]">
                Upload your PDF documents for processing and citation extraction
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            )}

            {/* Book Name Prompt Modal */}
            {showBookNamePrompt && pendingTaskForBookName && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl shadow-xl max-w-md w-full p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 p-2 bg-yellow-50 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                        Book Name Required
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        The PDF metadata doesn't contain a title. Please enter a name for this book.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Book Name
                    </label>
                    <input
                      type="text"
                      value={bookNameInput}
                      onChange={(e) => setBookNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleBookNameSubmit();
                        }
                      }}
                      placeholder="Enter book name..."
                      className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBookNameSubmit}
                      disabled={!bookNameInput.trim() || uploading}
                      className="flex-1 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {uploading ? "Uploading..." : "Upload with Name"}
                    </button>
                    <button
                      onClick={() => {
                        setShowBookNamePrompt(false);
                        setBookNameInput("");
                        setPendingTaskForBookName(null);
                        // Remove the failed task
                        if (pendingTaskForBookName) {
                          setUploadTasks((prev) =>
                            prev.filter((task) => task.task_id !== pendingTaskForBookName.taskId)
                          );
                        }
                      }}
                      disabled={uploading}
                      className="px-4 py-2 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Card */}
            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
                    dragActive
                      ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5"
                      : "border-[var(--color-border-secondary)]"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-[var(--color-accent-primary)]/10 rounded-full">
                      <Upload className="w-8 h-8 text-[var(--color-accent-primary)]" />
                    </div>

                    {selectedFiles.length > 0 ? (
                      <div className="w-full space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedFiles.map((file, index) => (
                          <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 p-3 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border-primary)]">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                  {file.name}
                                </div>
                                <p className="text-xs text-[var(--color-text-tertiary)]">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedFiles((prev) => prev.filter((f, i) => i !== index));
                              }}
                              className="text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors flex-shrink-0"
                              title="Remove file"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-base font-medium text-[var(--color-text-primary)] mb-1">
                            Drop your PDF(s) here, or{" "}
                            <label className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]/80 cursor-pointer transition-colors">
                              browse
                              <input
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={(e) =>
                                  handleFileSelect(e.target.files)
                                }
                                className="hidden"
                              />
                            </label>
                          </p>
                          <p className="text-sm text-[var(--color-text-tertiary)]">
                            Supports: PDF files only (multiple files allowed)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleUpload()}
                    disabled={selectedFiles.length === 0 || uploading}
                    className="flex-1 px-6 py-3 bg-[var(--color-accent-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload {selectedFiles.length > 1 ? `${selectedFiles.length} PDFs` : "PDF"}
                      </>
                    )}
                  </button>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={() => setSelectedFiles([])}
                      disabled={uploading}
                      className="px-6 py-3 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-xl font-medium hover:bg-[var(--color-surface-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Upload History */}
            {uploadTasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  Recent Uploads
                </h2>
                <div className="space-y-3">
                  {uploadTasks.map((task) => (
                    <UploadTaskCard
                      key={task.task_id}
                      task={task}
                      onRefresh={() => checkTaskStatus(task.task_id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* My Books Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  My Books
                </h2>
                <button
                  onClick={fetchMyBooks}
                  disabled={loadingBooks}
                  className="text-sm text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]/80 font-medium transition-colors disabled:opacity-50"
                >
                  {loadingBooks ? "Loading..." : "Refresh"}
                </button>
              </div>

              {loadingBooks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
                </div>
              ) : myBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-xl p-8 text-center">
                  <Book className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-3" />
                  <p className="text-[var(--color-text-secondary)]">
                    No books uploaded yet. Upload your first PDF to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
    </div>
  );
}