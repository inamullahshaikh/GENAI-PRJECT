import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
  Book,
  BookCheck,
  Loader2,
  MessageSquare,
  MessagesSquare,
  User,
  Mail,
  ShieldCheck,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";

// API Base URL - adjust this to match your backend
const API_BASE_URL = "http://localhost:8000"; // Change this to your actual API URL

/**
 * A reusable component for displaying individual analytics.
 */
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

/**
 * A reusable component for displaying a piece of user info.
 */
const UserInfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0 p-2.5 bg-[var(--color-surface-secondary)] rounded-full">
      <Icon className="w-5 h-5 text-[var(--color-text-secondary)]" />
    </div>
    <div>
      <div className="text-xs text-[var(--color-text-tertiary)]">{label}</div>
      <div className="text-sm font-medium text-[var(--color-text-primary)]">
        {value}
      </div>
    </div>
  </div>
);

/**
 * Error display component
 */
const ErrorMessage = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
    <div>
      <h3 className="text-lg font-semibold text-red-900 mb-1">
        Error Loading Dashboard
      </h3>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get access token from localStorage
        const token = localStorage.getItem("accessToken");

        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        console.log(headers);

        // Fetch user data, books (first page for analytics), and chats (first page for count) in parallel
        const [userResponse, booksResponse, chatsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/users/getmyprofile/me`, { headers }),
          fetch(`${API_BASE_URL}/books/me?page=1&limit=100`, { headers }), // Get first 100 for status counts
          fetch(`${API_BASE_URL}/chats/me?page=1&limit=1`, { headers }), // Just get total count
        ]);

        // Check if responses are ok
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(
            `Failed to fetch user data: ${userResponse.statusText}`
          );
        }

        if (!booksResponse.ok) {
          throw new Error(`Failed to fetch books: ${booksResponse.statusText}`);
        }

        if (!chatsResponse.ok) {
          throw new Error(`Failed to fetch chats: ${chatsResponse.statusText}`);
        }

        // Parse responses
        const userData = await userResponse.json();
        const booksData = await booksResponse.json();
        const chatsData = await chatsResponse.json();

        // Set user data
        setUser({
          name: userData.name || "User",
          email: userData.email || "N/A",
          role: userData.role === "admin" ? "Admin" : "User",
          dob: userData.dob || null,
        });

        // Calculate analytics from books data (using paginated response)
        const books = booksData.books || [];
        const totalBooks = booksData.total || 0;
        const booksReady = books.filter(
          (book) => book.status === "complete"
        ).length;
        const booksProcessing = books.filter(
          (book) => book.status === "processing"
        ).length;

        // Get total chats from paginated response
        const totalChats = chatsData.total || 0;

        console.log("Number of chats:", totalChats);

        // Set analytics
        setAnalytics({
          totalBooks,
          booksReady,
          booksProcessing,
          totalChats,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data");

        // If unauthorized, redirect to login
        if (
          err.message.includes("log in again") ||
          err.message.includes("expired")
        ) {
          localStorage.removeItem("accessToken");
          window.location.href = "/login"; // Adjust this to your login route
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Header */}
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Dashboard
          </h1>

          {loading ? (
            // --- Loading State ---
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[var(--color-accent-primary)] animate-spin mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)]">
                  Loading your dashboard...
                </p>
              </div>
            </div>
          ) : error ? (
            // --- Error State ---
            <ErrorMessage message={error} />
          ) : (
            // --- Loaded Content ---
            <>
              {/* Welcome & User Info Card */}
              {user && (
                <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-2xl shadow-sm">
                  <div className="p-6">
                    <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
                      Welcome back, {user.name}!
                    </h2>
                    <p className="text-base text-[var(--color-text-secondary)] mb-6">
                      Here's a summary of your activity on FastCite.
                    </p>

                    {/* User Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <UserInfoItem
                        icon={User}
                        label="Full Name"
                        value={user.name}
                      />
                      <UserInfoItem
                        icon={Mail}
                        label="Email Address"
                        value={user.email}
                      />
                      <UserInfoItem
                        icon={ShieldCheck}
                        label="Account Role"
                        value={user.role}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Grid */}
              {analytics && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                      Your Analytics
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <AnalyticsCard
                      title="Total Books Uploaded"
                      value={analytics.totalBooks}
                      icon={Book}
                      description="All documents you've uploaded."
                    />
                    <AnalyticsCard
                      title="Books Ready"
                      value={analytics.booksReady}
                      icon={BookCheck}
                      description="Documents that are fully processed."
                    />
                    <AnalyticsCard
                      title="Books Processing"
                      value={analytics.booksProcessing}
                      icon={Loader2}
                      description="Documents currently being processed."
                    />
                    <AnalyticsCard
                      title="Total Chat Sessions"
                      value={analytics.totalChats}
                      icon={MessageSquare}
                      description="Total conversations started."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
