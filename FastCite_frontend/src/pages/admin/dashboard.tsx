import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Book,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Loader2,
  Shield,
  Database,
  Plus,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

const AnalyticsCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
        {title}
      </span>
      <div className="p-2 bg-[var(--color-accent-primary)]/10 rounded-lg">
        <Icon className="w-5 h-5 text-[var(--color-accent-primary)]" />
      </div>
    </div>
    <div className="text-3xl font-bold text-[var(--color-text-primary)] mb-1">
      {value}
    </div>
    {description && (
      <p className="text-xs text-[var(--color-text-tertiary)]">{description}</p>
    )}
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/40 rounded-2xl p-6 flex items-start gap-3">
    <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-1">
        Error Loading Dashboard
      </h3>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  </div>
);

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers,
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Admin access required");
          }
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <ErrorMessage message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] custom-scrollbar">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-[var(--color-accent-primary)]" />
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-base text-[var(--color-text-secondary)]">
              Overview of system statistics and activity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnalyticsCard
              title="Total Users"
              value={stats?.total_users || 0}
              icon={Users}
              description="Registered users"
            />
            <AnalyticsCard
              title="Total Books"
              value={stats?.total_books || 0}
              icon={Book}
              description="Uploaded documents"
            />
            <AnalyticsCard
              title="Total Chats"
              value={stats?.total_chats || 0}
              icon={MessageSquare}
              description="Chat sessions"
            />
            <AnalyticsCard
              title="Active Users (30d)"
              value={stats?.active_users_30d || 0}
              icon={TrendingUp}
              description="Logged in last month"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/admin/users")}
                className="p-4 bg-blue-500/10 dark:bg-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 border border-blue-500/20 dark:border-blue-500/30 rounded-xl transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                  Manage Users
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  View, create, edit, and delete users
                </p>
              </button>
              <button
                onClick={() => navigate("/admin/books")}
                className="p-4 bg-green-500/10 dark:bg-green-500/20 hover:bg-green-500/20 dark:hover:bg-green-500/30 border border-green-500/20 dark:border-green-500/30 rounded-xl transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Book className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <ArrowRight className="w-5 h-5 text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                  Manage Books
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  View, create, edit, and delete books
                </p>
              </button>
              <button
                onClick={() => navigate("/admin/chats")}
                className="p-4 bg-purple-500/10 dark:bg-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 border border-purple-500/20 dark:border-purple-500/30 rounded-xl transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">
                  Manage Chats
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  View, create, edit, and delete chats
                </p>
              </button>
            </div>
          </div>

          {/* Pending Signup Requests Alert */}
          {stats?.pending_signup_requests > 0 && (
            <div className="bg-yellow-500/10 dark:bg-yellow-500/20 border-2 border-yellow-500/40 dark:border-yellow-500/50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/20 dark:bg-yellow-500/30 rounded-full">
                    <UserPlus className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                      Pending Admin Signup Requests
                    </h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      You have {stats.pending_signup_requests} admin signup request{stats.pending_signup_requests !== 1 ? 's' : ''} waiting for approval
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/signup-requests")}
                  className="px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-all flex items-center gap-2"
                >
                  Review Requests
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Books by Status */}
            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[var(--color-accent-primary)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Books by Status
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Processing
                    </span>
                  </div>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.books_by_status?.processing || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 dark:border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Complete
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {stats?.books_by_status?.complete || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Users by Role */}
            <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[var(--color-accent-primary)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Users by Role
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 dark:border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Administrators
                    </span>
                  </div>
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.users_by_role?.admin || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      Regular Users
                    </span>
                  </div>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.users_by_role?.user || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

