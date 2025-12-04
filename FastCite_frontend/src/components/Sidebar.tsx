import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  PlusSquare,
  FileUp,
  Library,
  User,
  LogOut,
  Trash2,
  Settings,
  ChevronDown,
  Shield,
  Users,
  Book,
  MessageSquare,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../context/themetoggle";
import { usePagination } from "../hooks/usePagination";
// API Base URL - update this to match your backend
const API_BASE_URL = "http://localhost:8000";

// Reusable NavLink component for styling with navigation
const NavLink = ({
  path,
  icon: Icon,
  children,
  isPrimary = false,
  isActive = false,
  onClick,
}) => {
  const navigate = useNavigate();

  const baseStyle =
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer";
  const primaryStyle =
    "bg-[var(--color-accent-primary)] text-white font-semibold hover:bg-[var(--color-accent-hover)]";
  const activeStyle =
    "bg-[var(--color-surface-secondary)] text-[var(--color-accent-primary)] font-semibold";
  const secondaryStyle =
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]";

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
    } else {
      navigate(path);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`${baseStyle} ${
        isPrimary ? primaryStyle : isActive ? activeStyle : secondaryStyle
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </div>
  );
};

// Reusable ChatLink component with delete functionality
const ChatLink = ({ chatId, title, isActive, onDelete }) => {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = (e) => {
    // Don't navigate if clicking the delete button
    if (e.target.closest(".delete-btn")) return;
    navigate(`/chat/${chatId}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;

    if (window.confirm("Are you sure you want to delete this chat?")) {
      setIsDeleting(true);
      try {
        await onDelete(chatId);
      } catch (error) {
        console.error("Failed to delete chat:", error);
        alert("Failed to delete chat. Please try again.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 cursor-pointer ${
        isActive
          ? "bg-[var(--color-surface-secondary)] text-[var(--color-accent-primary)] font-medium"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      <span className="truncate pr-2">{title}</span>
      {showDelete && (
        <button
          className="delete-btn flex-shrink-0 p-1.5 rounded-md hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState<'user' | 'admin'>(() => {
    // Get mode from localStorage, default to 'user'
    const savedMode = localStorage.getItem('adminMode');
    return (savedMode === 'admin' || savedMode === 'user') ? savedMode : 'user';
  });
  const [isManuallyToggled, setIsManuallyToggled] = useState(false);
  const pagination = usePagination({ initialPage: 1, initialLimit: 20 });
  const chatsContainerRef = useRef<HTMLDivElement>(null);

  // Check if user is admin (only on mount)
  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/getmyprofile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const userIsAdmin = userData.role === "admin";
          setIsAdmin(userIsAdmin);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkAdmin();
  }, []);

  // Auto-sync mode based on current route (only if not manually toggled)
  useEffect(() => {
    if (!isAdmin) return;
    
    // Skip auto-sync if mode was just manually toggled
    if (isManuallyToggled) {
      // Reset the flag after navigation completes
      const timer = setTimeout(() => {
        setIsManuallyToggled(false);
      }, 500);
      return () => clearTimeout(timer);
    }

    const isOnAdminPage = location.pathname.startsWith('/admin');
    const savedMode = localStorage.getItem('adminMode');
    const currentMode = (savedMode === 'admin' || savedMode === 'user') ? savedMode : 'user';
    
    // Only auto-sync if there's a mismatch and we're not in the middle of a toggle
    if (isOnAdminPage && currentMode !== 'admin' && adminMode !== 'admin') {
      setAdminMode('admin');
      localStorage.setItem('adminMode', 'admin');
    } else if (!isOnAdminPage && currentMode !== 'user' && adminMode !== 'user') {
      setAdminMode('user');
      localStorage.setItem('adminMode', 'user');
    }
  }, [location.pathname, isAdmin, isManuallyToggled, adminMode]);

  // Fetch chats from API - only on mount, when page changes, and when in user mode
  useEffect(() => {
    // Only fetch chats if not in admin mode (or not an admin)
    if (!isAdmin || adminMode === 'user') {
      fetchChats(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, adminMode, isAdmin]);

  // Listen for new chat creation events
  useEffect(() => {
    const handleChatCreated = () => {
      // Reset to first page and refresh chats
      // If we're already on page 1, just refresh directly
      if (pagination.page === 1) {
        fetchChats(true);
      } else {
        // Otherwise, set page to 1 which will trigger fetchChats via the other useEffect
        pagination.setPage(1);
      }
    };

    window.addEventListener('chatCreated', handleChatCreated);
    return () => {
      window.removeEventListener('chatCreated', handleChatCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchChats = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setChats([]);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/chats/me?page=${pagination.page}&limit=${pagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const data = await response.json();

      // Update pagination state
      pagination.setPaginationData({
        hasMore: data.has_more,
        total: data.total,
      });

      if (reset) {
        setChats(data.chats || []);
      } else {
        setChats((prev) => [...prev, ...(data.chats || [])]);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      pagination.nextPage();
    }
  };

  // Delete chat handler
  const handleDeleteChat = async (chatId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // Remove chat from local state
      setChats((prevChats) => {
        const filtered = prevChats.filter((chat) => chat.id !== chatId);
        // Update total count
        pagination.setPaginationData({
          hasMore: pagination.hasMore,
          total: pagination.total - 1,
        });
        return filtered;
      });

      // If we're currently viewing this chat, redirect to dashboard
      if (location.pathname === `/chat/${chatId}`) {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
      throw err;
    }
  };

  // Logout handler
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // Helper function to check if a path is active
  const isPathActive = (path) => {
    return location.pathname === path;
  };

  // Helper function to check if a chat is active
  const isChatActive = (chatId) => {
    return location.pathname === `/chat/${chatId}`;
  };

  // Toggle between user and admin mode
  const toggleAdminMode = () => {
    const newMode = adminMode === 'user' ? 'admin' : 'user';
    
    // Set flag to prevent auto-sync from interfering
    setIsManuallyToggled(true);
    
    // Update mode state and localStorage
    setAdminMode(newMode);
    localStorage.setItem('adminMode', newMode);
    
    // Redirect based on mode
    if (newMode === 'admin') {
      // If currently on a user page, go to admin dashboard
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin/dashboard', { replace: true });
      }
    } else {
      // If currently on an admin page, go to user dashboard
      if (location.pathname.startsWith('/admin')) {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  // Fallback for logo
  const logoUrl = "https://placehold.co/64x64/6366f1/ffffff?text=FC&font=sans";

  return (
    <div className="h-screen w-72 flex flex-col bg-[var(--color-surface-primary)] border-r border-[var(--color-border-primary)] overflow-hidden">
      {/* Custom CSS for a dark, minimal scrollbar */}
      <style>
        {`
          /* For Webkit browsers (Chrome, Safari, Edge) */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: var(--color-surface-primary);
            border-radius: 10px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4a4a4a;
            border-radius: 10px;
            border: 2px solid var(--color-surface-primary);
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #4a4a4a var(--color-surface-primary);
          }
        `}
      </style>

      {/* 1. Top Section (Logo & Nav) - Fixed */}
      <div className="flex-shrink-0">
        {/* Logo and App Name */}
        <div className="flex items-center gap-2 sm:gap-3 p-6">
          <img
            src={logo}
            alt="FastCite Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = logoUrl;
            }}
          />
          <span className="text-xl font-bold text-[var(--color-text-primary)]">
            FastCite
          </span>
        </div>

        {/* Mode Toggle for Admins */}
        {isAdmin && (
          <div className="px-4 pb-4">
            <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border-primary)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Mode
                </span>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  <button
                    onClick={toggleAdminMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 ${
                      adminMode === 'admin'
                        ? 'bg-[var(--color-accent-primary)]'
                        : 'bg-[var(--color-border-secondary)]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        adminMode === 'admin' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <Shield className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${
                  adminMode === 'user' 
                    ? 'text-[var(--color-text-primary)]' 
                    : 'text-[var(--color-text-tertiary)]'
                }`}>
                  User
                </span>
                <span className={`text-xs font-medium ${
                  adminMode === 'admin' 
                    ? 'text-[var(--color-text-primary)]' 
                    : 'text-[var(--color-text-tertiary)]'
                }`}>
                  Admin
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="px-4 pb-4">
          <div className="space-y-2">
            {/* User Navigation - Visible in user mode or if not admin */}
            {(!isAdmin || adminMode === 'user') && (
              <>
                <NavLink path="/new-chat" icon={PlusSquare} isPrimary={true}>
                  New Chat
                </NavLink>
                <NavLink
                  path="/dashboard"
                  icon={LayoutDashboard}
                  isActive={isPathActive("/dashboard")}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  path="/upload"
                  icon={FileUp}
                  isActive={isPathActive("/upload")}
                >
                  Upload Document
                </NavLink>
                <NavLink
                  path="/manage"
                  icon={Library}
                  isActive={isPathActive("/manage")}
                >
                  Manage Uploads
                </NavLink>
                <NavLink
                  path="/feedback"
                  icon={MessageCircle}
                  isActive={isPathActive("/feedback")}
                >
                  Feedback
                </NavLink>
              </>
            )}

            {/* Admin Navigation - Only visible in admin mode */}
            {isAdmin && adminMode === 'admin' && (
              <>
                <NavLink
                  path="/admin/dashboard"
                  icon={Shield}
                  isPrimary={true}
                  isActive={isPathActive("/admin/dashboard")}
                >
                  Admin Dashboard
                </NavLink>
                <NavLink
                  path="/admin/users"
                  icon={Users}
                  isActive={isPathActive("/admin/users")}
                >
                  Manage Users
                </NavLink>
                <NavLink
                  path="/admin/books"
                  icon={Book}
                  isActive={isPathActive("/admin/books")}
                >
                  Manage Books
                </NavLink>
                <NavLink
                  path="/admin/chats"
                  icon={MessageSquare}
                  isActive={isPathActive("/admin/chats")}
                >
                  Manage Chats
                </NavLink>
                <NavLink
                  path="/admin/feedback"
                  icon={MessageCircle}
                  isActive={isPathActive("/admin/feedback")}
                >
                  Manage Feedback
                </NavLink>
                <NavLink
                  path="/admin/chat-feedback"
                  icon={MessageSquare}
                  isActive={isPathActive("/admin/chat-feedback")}
                >
                  Chat Feedback
                </NavLink>
                <NavLink
                  path="/admin/signup-requests"
                  icon={UserPlus}
                  isActive={isPathActive("/admin/signup-requests")}
                >
                  Signup Requests
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* 2. Middle Section (Chat History) - Scrollable - Only in User Mode */}
      {(!isAdmin || adminMode === 'user') && (
        <div 
          ref={chatsContainerRef}
          className="flex-1 overflow-y-auto px-4 custom-scrollbar"
        >
          {/* Header for chat list */}
          <div className="h-10 flex items-center sticky top-0 bg-[var(--color-surface-primary)] z-10">
            <span className="text-xs font-medium uppercase text-[var(--color-text-tertiary)] tracking-wider">
              Previous Chats
            </span>
          </div>

          {/* Chat List */}
          <div className="space-y-1 pb-4">
            {isLoading ? (
              <div className="text-center py-4 text-[var(--color-text-tertiary)] text-sm">
                Loading chats...
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500 text-sm">
                Failed to load chats
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-4 text-[var(--color-text-tertiary)] text-sm">
                No chats yet. Start a new chat!
              </div>
            ) : (
              <>
                {chats.map((chat) => (
                  <ChatLink
                    key={chat.id}
                    chatId={chat.id}
                    title={chat.title || "Untitled Chat"}
                    isActive={isChatActive(chat.id)}
                    onDelete={handleDeleteChat}
                  />
                ))}
                {pagination.hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full py-2 px-3 mt-2 text-sm text-[var(--color-accent-primary)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      "Loading..."
                    ) : (
                      <>
                        Load More ({pagination.total - chats.length} remaining)
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Admin Mode - Empty space or admin info */}
      {isAdmin && adminMode === 'admin' && (
        <div className="flex-1 flex items-center justify-center px-4 min-h-0">
          <div className="text-center">
          </div>
        </div>
      )}

      {/* 3. Bottom Section (User Profile) - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--color-border-primary)]">
        <div className="space-y-2">
          <NavLink
            path={isAdmin && adminMode === 'admin' ? "/admin/setting" : "/setting"}
            icon={Settings}
            isActive={isPathActive("/setting") || isPathActive("/admin/setting")}
          >
            Settings
          </NavLink>
          <NavLink path="/login" icon={LogOut} onClick={handleLogout}>
            Log Out
          </NavLink>
        </div>
      </div>
    </div>
  );
}
