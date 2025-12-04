import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  Search,
  BookOpen,
  Send,
  Loader2,
  X,
  ChevronDown,
  AlertCircle,
  FileText,
  ExternalLink,
  Maximize2,
  Minimize2,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// PDF Modal Viewer Component
const PDFModal = ({ file, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-[var(--color-surface-primary)] rounded-lg shadow-2xl flex flex-col transition-all ${
          isFullscreen ? "w-full h-full" : "w-[90%] h-[90%] max-w-6xl"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded bg-[var(--color-accent-primary)] bg-opacity-10 flex items-center justify-center shrink-0">
              <FileText
                size={20}
                className="text-[var(--color-accent-primary)]"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--color-text-primary)] text-sm line-clamp-1">
                {file.path.split("/").pop() || "Document"}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                PDF Document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              ) : (
                <Maximize2
                  size={20}
                  className="text-[var(--color-text-secondary)]"
                />
              )}
            </button>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              title={`Open ${file.name} in new tab`}
            >
              {file.name}
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} className="text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={file.url}
            className="w-full h-full border-0"
            title={file.path.split("/").pop() || "PDF Document"}
          />
        </div>
      </div>
    </div>
  );
};

// Memoized markdown components to prevent re-creation on every render
const markdownComponents = {
  h1: ({ node, ...props }: any) => (
    <h1
      className="text-2xl font-bold mt-4 mb-2 text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className="text-xl font-bold mt-3 mb-2 text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="text-lg font-semibold mt-3 mb-1 text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  p: ({ node, ...props }: any) => (
    <p
      className="mb-2 text-[var(--color-text-primary)] leading-relaxed"
      {...props}
    />
  ),
  ul: ({ node, ...props }: any) => (
    <ul
      className="list-disc list-inside mb-2 space-y-1 text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  ol: ({ node, ...props }: any) => (
    <ol
      className="list-decimal list-inside mb-2 space-y-1 text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  li: ({ node, ...props }: any) => (
    <li className="ml-4 text-[var(--color-text-primary)]" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong
      className="font-semibold text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  em: ({ node, ...props }: any) => (
    <em
      className="italic text-[var(--color-text-primary)]"
      {...props}
    />
  ),
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code
        className="bg-[var(--color-surface-hover)] px-1 py-0.5 rounded text-sm font-mono text-[var(--color-accent-primary)]"
        {...props}
      />
    ) : (
      <code
        className="block bg-[var(--color-surface-hover)] p-3 rounded-lg text-sm font-mono overflow-x-auto mb-2"
        {...props}
      />
    ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-[var(--color-accent-primary)] pl-4 italic my-2 text-[var(--color-text-secondary)]"
      {...props}
    />
  ),
};

// Typing Animation Component
const TypingMessage = ({ content, onComplete }: { content: string; onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!content) return;

    let currentIndex = 0;
    const typingSpeed = 1;

    const interval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [content, onComplete]);

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {displayedContent}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-[var(--color-accent-primary)] animate-pulse ml-1"></span>
      )}
    </div>
  );
};

// Memoized Message Component to prevent unnecessary re-renders
const MessageItem = memo(({ 
  msg, 
  idx, 
  typingMessageIndex, 
  messageIndex,
  isAnswer,
  downloadingMessage,
  onViewFile,
  onTypingComplete,
  onDownloadMessage,
  onFeedback,
  chatId
}: {
  msg: any;
  idx: number;
  typingMessageIndex: number | null;
  messageIndex: number;
  isAnswer: boolean;
  downloadingMessage: number | null;
  onViewFile: (file: any) => void;
  onTypingComplete: (idx: number) => void;
  onDownloadMessage: (index: number) => void;
  onFeedback: (messageIndex: number, question: string, answer: string) => void;
  chatId: string | null;
  userQuestion: string;
}) => {
  const cleanedContent = useMemo(() => {
    return msg.content.replace(/^\s+\|/gm, " |");
  }, [msg.content]);

  return (
    <div
      className={`animate-fade-in ${
        msg.role === "user" ? "flex justify-end" : "w-full"
      }`}
    >
      {msg.role === "user" ? (
        <div className="max-w-[70%] bg-[var(--color-accent-primary)] text-white rounded-2xl px-5 py-3 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed">
            {msg.content}
          </p>
        </div>
      ) : (
        <div className="w-full">
          {msg.isError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle
                className="text-red-500 shrink-0 mt-0.5"
                size={20}
              />
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {cleanedContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : msg.isTyping && idx === typingMessageIndex ? (
            <TypingMessage
              content={msg.content}
              onComplete={() => onTypingComplete(idx)}
            />
          ) : (
            <>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {cleanedContent}
                </ReactMarkdown>
              </div>
              {msg.downloaded_files &&
                msg.downloaded_files.length > 0 && (
                  <div className="mt-4 p-4 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border-primary)]">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText
                        size={18}
                        className="text-[var(--color-accent-primary)]"
                      />
                      <h4 className="font-semibold text-[var(--color-text-primary)] text-sm">
                        Source Documents ({msg.downloaded_files.length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                      {msg.downloaded_files.map(
                        (file: any, fileIdx: number) => (
                          <button
                            key={fileIdx}
                            onClick={() => onViewFile(file)}
                            className="w-full flex items-center gap-3 p-3 bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border-primary)] transition-colors group"
                          >
                            <div className="w-10 h-10 rounded bg-[var(--color-accent-primary)] bg-opacity-10 flex items-center justify-center shrink-0">
                              <FileText
                                size={20}
                                className="text-[var(--color-accent-primary)]"
                              />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="font-medium text-[var(--color-text-primary)] text-sm line-clamp-1">
                                {file.name || "Document"}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)]">
                                Click to view PDF
                              </div>
                            </div>
                            <ExternalLink
                              size={16}
                              className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-primary)] transition-colors shrink-0"
                            />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              {isAnswer && !msg.isError && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onFeedback(messageIndex, userQuestion, msg.content);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border-primary)] transition-colors"
                    title="Provide feedback on this response"
                  >
                    <MessageSquare size={16} className="text-[var(--color-accent-primary)]" />
                    <span className="text-sm text-[var(--color-text-primary)]">Feedback</span>
                  </button>
                  <button
                    onClick={() => onDownloadMessage(messageIndex)}
                    disabled={downloadingMessage === messageIndex}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-primary)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border-primary)] transition-colors disabled:opacity-50"
                    title="Download this Q&A as PDF"
                  >
                    {downloadingMessage === messageIndex ? (
                      <>
                        <Loader2 size={16} className="text-[var(--color-accent-primary)] animate-spin" />
                        <span className="text-sm text-[var(--color-text-primary)]">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} className="text-[var(--color-accent-primary)]" />
                        <span className="text-sm text-[var(--color-text-primary)]">Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo - only re-render if content actually changed
  return (
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.msg.role === nextProps.msg.role &&
    prevProps.msg.isError === nextProps.msg.isError &&
    prevProps.msg.isTyping === nextProps.msg.isTyping &&
    prevProps.msg.downloaded_files?.length === nextProps.msg.downloaded_files?.length &&
    prevProps.typingMessageIndex === nextProps.typingMessageIndex &&
    prevProps.downloadingMessage === nextProps.downloadingMessage &&
    prevProps.idx === nextProps.idx &&
    prevProps.chatId === nextProps.chatId
  );
});

MessageItem.displayName = 'MessageItem';

// Helper to get initials from book title
const getBookInitials = (title) => {
  if (!title) return "?";
  const words = title.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Book Selector Dropdown
const BookSelector = ({
  selectedBook,
  onSelectBook,
  books,
  isLoadingBooks,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (book.author_name &&
        book.author_name.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBook = (book) => {
    onSelectBook(book);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingBooks}
        className="flex items-center gap-3 px-4 py-2 bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border-primary)] transition-colors min-w-[280px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoadingBooks ? (
          <>
            <Loader2
              size={20}
              className="animate-spin text-[var(--color-text-secondary)]"
            />
            <span className="flex-1 text-left text-[var(--color-text-secondary)]">
              Loading books...
            </span>
          </>
        ) : selectedBook ? (
          <>
            <div className="w-8 h-8 rounded bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-sm font-semibold">
              {getBookInitials(selectedBook.title)}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-[var(--color-text-primary)] text-sm line-clamp-1">
                {selectedBook.title}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                {selectedBook.author_name || "Unknown Author"}
              </div>
            </div>
          </>
        ) : (
          <>
            <BookOpen
              size={20}
              className="text-[var(--color-text-secondary)]"
            />
            <span className="flex-1 text-left text-[var(--color-text-secondary)]">
              Select a book
            </span>
          </>
        )}
        <ChevronDown
          size={18}
          className={`text-[var(--color-text-secondary)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[400px] bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border-primary)] shadow-lg z-50 animate-fade-in">
          <div className="p-3 border-b border-[var(--color-border-primary)]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                size={16}
              />
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-primary w-full pl-9 py-2 text-sm"
                autoFocus
              />
            </div>
          </div>

          <div
            className="max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            {filteredBooks.length > 0 ? (
              <div className="p-2">
                {filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleSelectBook(book)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors text-left ${
                      selectedBook?.id === book.id
                        ? "bg-[var(--color-surface-hover)]"
                        : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded bg-[var(--color-accent-primary)] flex items-center justify-center text-white font-semibold shrink-0">
                      {getBookInitials(book.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--color-text-primary)] text-sm line-clamp-1">
                        {book.title}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                        {book.author_name || "Unknown Author"}{" "}
                        {book.pages && `• ${book.pages} pages`}
                      </div>
                      {book.status === "processing" && (
                        <div className="text-xs text-[var(--color-warning)] mt-1">
                          Processing...
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">
                No books uploaded yet
              </div>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">
                No books found matching "{debouncedSearch}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const NewChatPage = () => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [downloadingChat, setDownloadingChat] = useState(false);
  const [downloadingMessage, setDownloadingMessage] = useState<number | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{messageIndex: number; question: string; answer: string} | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"positive" | "negative" | "neutral" | null>(null);
  const [starRating, setStarRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setIsLoadingBooks(true);
    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        console.error("No access token found");
        setIsLoadingBooks(false);
        return;
      }

      const response = await fetch("http://localhost:8000/books/me?page=1&limit=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }

      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const generateChatTitle = (prompt) => {
    const maxLength = 50;
    let title = prompt.trim();
    title = title.replace(/[?!.]+$/, "");
    if (title.length > maxLength) {
      title = title.substring(0, maxLength).trim() + "...";
    }
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title;
  };

  const createChatSession = async (firstQuestion, title) => {
    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      const chatSession = {
        title: title,
      };

      const response = await fetch("http://localhost:8000/chats/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatSession),
      });

      if (!response.ok) {
        throw new Error(`Failed to create chat: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Chat session created:", data);

      if (!data.id && !data._id && !data.chat_id) {
        console.log("No ID in response, fetching latest chat...");

        const chatsResponse = await fetch("http://localhost:8000/chats/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!chatsResponse.ok) {
          throw new Error("Failed to fetch chats after creation");
        }

        const chats = await chatsResponse.json();

        if (chats && chats.length > 0) {
          const latestChat = chats[chats.length - 1];
          console.log("Found latest chat:", latestChat);
          return latestChat;
        }

        throw new Error("Could not find created chat session");
      }

      return data;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  };

  // Only scroll when new messages are added, not on every render
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length]);

  const handleSendQuery = useCallback(async () => {
    if (!query.trim() || !selectedBook) return;

    const userMessage = { role: "user", content: query };
    const currentQuery = query;
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
    }

    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      let sessionId = chatId;
      if (!chatId && messages.length === 0) {
        const title = generateChatTitle(currentQuery);
        setChatTitle(title);

        const chatSession = await createChatSession(currentQuery, title);
        sessionId = chatSession.id;
        setChatId(sessionId);

        console.log("Created chat session with ID:", sessionId);
        
        // Notify sidebar to refresh chat list
        window.dispatchEvent(new CustomEvent('chatCreated', { 
          detail: { chatId: sessionId, title: title } 
        }));
      }

      console.log("Using session ID:", sessionId);
      console.log(
        JSON.stringify({
          prompt: currentQuery,
          book_id: selectedBook.id,
          top_k: 3,
          chat_session_id: sessionId,
        })
      );

      const response = await fetch("http://localhost:8000/rag/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentQuery,
          book_id: selectedBook.id,
          top_k: 3,
          chat_session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (errorData && errorData.error) {
          const errorMsg = errorData.error.message || errorData.error;
          if (errorMsg.includes("overloaded") || errorMsg.includes("503")) {
            throw new Error("SERVICE_OVERLOADED");
          }
        }

        throw new Error(`Failed to query: ${response.statusText}`);
      }

      const data = await response.json();
      const ERROR_MESSAGE =
        "Error: 503 UNAVAILABLE. {'error': {'code': 503, 'message': 'The model is overloaded. Please try again later.', 'status': 'UNAVAILABLE'}}";

      if (data.answer === ERROR_MESSAGE) {
        data.answer =
          "⚠️ **Service Temporarily Unavailable**\n\nThe AI model is currently experiencing high demand. Please wait a moment and try again.";
      }
      console.log(data);
      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        reasoning: data.reasoning,
        contexts_count: data.contexts_count,
        downloaded_files: data.downloaded_files || [],
        isTyping: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setTypingMessageIndex((prev) => (prev === null ? 0 : prev) + 1);
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error sending query:", error);
      setIsLoading(false);

      let errorContent =
        "⚠️ **Something went wrong**\n\nAn unexpected error occurred. Please try again.";
      const ERROR_MESSAGE =
        "Error: 503 UNAVAILABLE. {'error': {'code': 503, 'message': 'The model is overloaded. Please try again later.', 'status': 'UNAVAILABLE'}}";

      if (error.answer === ERROR_MESSAGE) {
        error.answer =
          "⚠️ **Service Temporarily Unavailable**\n\nThe AI model is currently experiencing high demand. Please wait a moment and try again.";
      } else if (
        error.answer.includes("503") ||
        error.answer.includes("UNAVAILABLE")
      ) {
        error.answer =
          "⚠️ **Service Temporarily Unavailable**\n\nThe service is currently overloaded. Please try again in a few moments.";
      } else if (
        error.answer.includes("network") ||
        error.answer.includes("fetch")
      ) {
        error.answer =
          "⚠️ **Connection Error**\n\nUnable to connect to the server. Please check your internet connection and try again.";
      }

      const errorMessage = {
        role: "assistant",
        content: errorContent,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [query, selectedBook, chatId]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      // Use requestAnimationFrame to avoid layout thrashing and improve performance
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'; // Reset height to recalculate
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
      });
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  }, [handleSendQuery]);

  const resetChat = () => {
    setSelectedBook(null);
    setMessages([]);
    setQuery("");
    setChatId(null);
    setChatTitle(null);
  };

  const handleDownloadChat = async () => {
    if (!chatId || downloadingChat) return;
    
    try {
      setDownloadingChat(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(`http://localhost:8000/chats/${chatId}/download`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download chat");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chatTitle || "chat"}_${chatId?.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading chat:", error);
      alert("Failed to download chat PDF");
    } finally {
      setDownloadingChat(false);
    }
  };

  const handleFeedback = useCallback((messageIndex: number, question: string, answer: string) => {
    setFeedbackModal({ messageIndex, question, answer });
    setFeedbackRating(null);
    setStarRating(null);
    setHoveredStar(null);
    setFeedbackComment("");
  }, []);

  const handleSubmitFeedback = async () => {
    if (!starRating || !chatId || !feedbackModal) return;

    try {
      setSubmittingFeedback(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch("http://localhost:8000/chat-feedback/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_session_id: chatId,
          message_index: feedbackModal.messageIndex,
          rating: feedbackRating,
          star_rating: starRating || null,
          comment: feedbackComment || null,
          question: feedbackModal.question,
          answer: feedbackModal.answer,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setFeedbackModal(null);
      setFeedbackRating(null);
      setStarRating(null);
      setHoveredStar(null);
      setFeedbackComment("");
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDownloadMessage = useCallback(async (messageIndex: number) => {
    if (!chatId || downloadingMessage !== null) return;
    
    try {
      setDownloadingMessage(messageIndex);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(`http://localhost:8000/chats/${chatId}/download/${messageIndex}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download message");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chatTitle || "chat"}_qa_${messageIndex + 1}_${chatId?.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading message:", error);
      alert("Failed to download message PDF");
    } finally {
      setDownloadingMessage(null);
    }
  }, [chatId, chatTitle, downloadingMessage]);

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar onNewChat={resetChat} />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-[var(--color-border-primary)] flex items-center justify-between px-6 bg-[var(--color-surface-primary)]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {chatTitle || "New Chat"}
            </h1>
            {chatId && messages.length > 0 && (
              <button
                onClick={handleDownloadChat}
                disabled={downloadingChat}
                className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors disabled:opacity-50"
                title="Download entire chat as PDF"
              >
                {downloadingChat ? (
                  <Loader2 size={18} className="text-[var(--color-accent-primary)] animate-spin" />
                ) : (
                  <Download size={18} className="text-[var(--color-accent-primary)]" />
                )}
              </button>
            )}
          </div>
          <BookSelector
            selectedBook={selectedBook}
            onSelectBook={setSelectedBook}
            books={books}
            isLoadingBooks={isLoadingBooks}
          />
        </div>

        {!selectedBook ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen
                size={64}
                className="mx-auto mb-4 text-[var(--color-text-tertiary)]"
              />
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                Select a book to start chatting
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Choose a book from the dropdown above to begin your conversation
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto p-6 custom-scrollbar"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-lg bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      {getBookInitials(selectedBook.title)}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      Start a conversation about {selectedBook.title}
                    </h3>
                    <p className="text-[var(--color-text-secondary)]">
                      Ask questions, explore themes, or discuss characters
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    // Calculate message index: messages alternate user/assistant
                    // Each Q&A pair = user message (even idx) + assistant message (odd idx)
                    const isAnswer = msg.role === "assistant";
                    const messageIndex = Math.floor(idx / 2); // Each Q&A is 2 messages
                    // Get the user question (previous message)
                    const userQuestion = idx > 0 && messages[idx - 1]?.role === "user" 
                      ? messages[idx - 1].content 
                      : "";
                    
                    return (
                      <MessageItem
                        key={idx}
                        msg={msg}
                        idx={idx}
                        typingMessageIndex={typingMessageIndex}
                        messageIndex={messageIndex}
                        isAnswer={isAnswer}
                        downloadingMessage={downloadingMessage}
                        onViewFile={setViewingFile}
                        onTypingComplete={(idx) => {
                          setTypingMessageIndex(null);
                          setMessages((prev) =>
                            prev.map((m, i) =>
                              i === idx ? { ...m, isTyping: false } : m
                            )
                          );
                        }}
                        onDownloadMessage={handleDownloadMessage}
                        onFeedback={(msgIdx, question, answer) => handleFeedback(msgIdx, question, answer)}
                        chatId={chatId}
                        userQuestion={userQuestion}
                      />
                    );
                  })
                )}

                {isLoading && (
                  <div className="w-full animate-fade-in">
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <Loader2
                        size={16}
                        className="animate-spin text-[var(--color-accent-primary)]"
                      />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-[var(--color-border-primary)] p-4 bg-[var(--color-surface-primary)]">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 items-end">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question about the book..."
                    className="input-primary flex-1 min-h-[56px] max-h-[200px] resize-none"
                    rows={1}
                    style={{
                      height: "56px",
                      minHeight: "56px",
                    }}
                  />
                  <button
                    onClick={handleSendQuery}
                    disabled={!query.trim() || isLoading}
                    className="btn-primary h-[56px] px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={18} />
                    Send
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      {viewingFile && (
        <PDFModal file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-primary)] rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Provide Feedback
              </h3>
              <button
                onClick={() => {
                  setFeedbackModal(null);
                  setFeedbackRating(null);
                  setStarRating(null);
                  setHoveredStar(null);
                  setFeedbackComment("");
                }}
                className="p-2 hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Question Preview */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Your Question
                </label>
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3">
                  <p className="text-sm text-[var(--color-text-primary)]">{feedbackModal.question}</p>
                </div>
              </div>

              {/* Star Rating Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  Rate this response (1-5 stars) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-10 h-10 ${
                          star <= (hoveredStar || starRating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  {starRating && (
                    <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                      {starRating} {starRating === 1 ? "star" : "stars"}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Rating Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  Quick Rating (Optional)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setFeedbackRating("positive")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      feedbackRating === "positive"
                        ? "border-green-500 bg-green-500/10"
                        : "border-[var(--color-border-primary)] hover:border-green-500/50"
                    }`}
                  >
                    <ThumbsUp className={`w-6 h-6 ${
                      feedbackRating === "positive" ? "text-green-500" : "text-[var(--color-text-tertiary)]"
                    }`} />
                    <span className={`text-sm font-medium ${
                      feedbackRating === "positive" ? "text-green-500" : "text-[var(--color-text-secondary)]"
                    }`}>
                      Positive
                    </span>
                  </button>
                  <button
                    onClick={() => setFeedbackRating("neutral")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      feedbackRating === "neutral"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-[var(--color-border-primary)] hover:border-yellow-500/50"
                    }`}
                  >
                    <MessageSquare className={`w-6 h-6 ${
                      feedbackRating === "neutral" ? "text-yellow-500" : "text-[var(--color-text-tertiary)]"
                    }`} />
                    <span className={`text-sm font-medium ${
                      feedbackRating === "neutral" ? "text-yellow-500" : "text-[var(--color-text-secondary)]"
                    }`}>
                      Neutral
                    </span>
                  </button>
                  <button
                    onClick={() => setFeedbackRating("negative")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      feedbackRating === "negative"
                        ? "border-red-500 bg-red-500/10"
                        : "border-[var(--color-border-primary)] hover:border-red-500/50"
                    }`}
                  >
                    <ThumbsDown className={`w-6 h-6 ${
                      feedbackRating === "negative" ? "text-red-500" : "text-[var(--color-text-tertiary)]"
                    }`} />
                    <span className={`text-sm font-medium ${
                      feedbackRating === "negative" ? "text-red-500" : "text-[var(--color-text-secondary)]"
                    }`}>
                      Negative
                    </span>
                  </button>
                </div>
              </div>

              {/* Optional Comment */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                  placeholder="Share any additional thoughts about this response..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setFeedbackModal(null);
                  setFeedbackRating(null);
                  setStarRating(null);
                  setHoveredStar(null);
                  setFeedbackComment("");
                }}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!starRating || submittingFeedback}
                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingFeedback ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewChatPage;
