import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Shield,
  Users,
  Book,
  MessageSquare,
  MessageCircle,
  Settings,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

const API_BASE_URL = "http://localhost:8000";

// Reusable NavLink component for styling with navigation
const NavLink = ({
  path,
  icon: Icon,
  children,
  isPrimary = false,
  isActive = false,
  onClick,
}: {
  path: string;
  icon: any;
  children: React.ReactNode;
  isPrimary?: boolean;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
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

  const handleClick = (e: React.MouseEvent) => {
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

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/users/getmyprofile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            name: userData.name || userData.username,
            email: userData.email,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Logout handler
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // Helper function to check if a path is active
  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  // Fallback for logo
  const logoUrl = "https://placehold.co/64x64/6366f1/ffffff?text=FC&font=sans";

  return (
    <div className="h-screen w-72 flex flex-col bg-[var(--color-surface-primary)] border-r border-[var(--color-border-primary)]">
      {/* Top Section - Logo & Navigation */}
      <div className="flex-shrink-0">
        {/* Logo and App Name */}
        <div className="flex items-center gap-2 sm:gap-3 p-6">
          <img
            src={logo}
            alt="FastCite Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = logoUrl;
            }}
          />
          <span className="text-xl font-bold text-[var(--color-text-primary)]">
            FastCite
          </span>
        </div>

        {/* Admin Badge */}
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="px-4 pb-4">
          <div className="space-y-2">
            <NavLink
              path="/admin/dashboard"
              icon={LayoutDashboard}
              isPrimary={true}
              isActive={isPathActive("/admin/dashboard")}
            >
              Dashboard
            </NavLink>
            <NavLink
              path="/admin/users"
              icon={Users}
              isActive={isPathActive("/admin/users")}
            >
              Users
            </NavLink>
            <NavLink
              path="/admin/books"
              icon={Book}
              isActive={isPathActive("/admin/books")}
            >
              Books
            </NavLink>
            <NavLink
              path="/admin/chats"
              icon={MessageSquare}
              isActive={isPathActive("/admin/chats")}
            >
              Chats
            </NavLink>
            <NavLink
              path="/admin/feedback"
              icon={MessageCircle}
              isActive={isPathActive("/admin/feedback")}
            >
              Feedback
            </NavLink>
            <NavLink
              path="/admin/signup-requests"
              icon={UserPlus}
              isActive={isPathActive("/admin/signup-requests")}
            >
              Signup Requests
            </NavLink>
          </div>
        </nav>
      </div>

      {/* Bottom Section - User Profile & Settings */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--color-border-primary)] mt-auto">
        {user && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--color-surface-secondary)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">
              {user.name}
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)] truncate">
              {user.email}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <NavLink
            path="/admin/setting"
            icon={Settings}
            isActive={isPathActive("/admin/setting")}
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

