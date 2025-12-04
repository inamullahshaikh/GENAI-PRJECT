import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import SignupPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/dashboard";
import GoogleRedirectHandler from "./pages/GoogleRedirectHandler";
import UploadPage from "./pages/uploadbook";
import ManageBooksPage from "./pages/managebooks";
import NewChatPage from "./pages/newchat";
import ChatHistoryPage from "./pages/chat";
import ProfilePage from "./pages/settings";
import AdminDashboardPage from "./pages/admin/dashboard";
import AdminUsersPage from "./pages/admin/users";
import AdminBooksPage from "./pages/admin/books";
import AdminChatsPage from "./pages/admin/chats";
import AdminFeedbackPage from "./pages/admin/feedback";
import AdminChatFeedbackPage from "./pages/admin/chat-feedback";
import AdminSettingsPage from "./pages/admin/settings";
import AdminSignupRequestsPage from "./pages/admin/signup-requests";
import FeedbackPage from "./pages/feedback";
import AdminRoute from "./components/AdminRoute";
import type { JSX } from "react";

const RootRedirect = () => {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Redirect all authenticated users to dashboard
  // Admins can access both user and admin features via the sidebar
  return <Navigate to="/dashboard" replace />;
};

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("accessToken"); // fixed key

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Google OAuth callback */}
        <Route
          path="/auth/google/callback"
          element={<GoogleRedirectHandler />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/new-chat"
          element={
            <ProtectedRoute>
              <NewChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              <ManageBooksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <ChatHistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/setting"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/books"
          element={
            <AdminRoute>
              <AdminBooksPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/chats"
          element={
            <AdminRoute>
              <AdminChatsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/feedback"
          element={
            <AdminRoute>
              <AdminFeedbackPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/chat-feedback"
          element={
            <AdminRoute>
              <AdminChatFeedbackPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/setting"
          element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/signup-requests"
          element={
            <AdminRoute>
              <AdminSignupRequestsPage />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
