import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Palette,
  Bell,
  Globe,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

const styles = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
`;

// Types
interface UserProfile {
  id: string;
  username: string;
  name: string;
  dob: string | null;
  email: string;
  role: "user" | "admin";
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type ActiveSection = "profile" | "security" | "preferences";

const ProfilePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    username: "",
    name: "",
    dob: "",
  });

  // Password change states
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Preferences states
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
  });
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("(UTC+05:00) Islamabad, Karachi");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState("");

  // Security states
  const [securityInfo, setSecurityInfo] = useState<{
    last_password_change: string | null;
    last_login: string | null;
    account_created: string | null;
  } | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordCode, setForgotPasswordCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPasswordField, setShowForgotPasswordField] = useState(false);
  const [showForgotPasswordVisibility, setShowForgotPasswordVisibility] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  
  // Account deletion verification states
  const [showDeleteCodeModal, setShowDeleteCodeModal] = useState(false);
  const [deleteAccountCode, setDeleteAccountCode] = useState("");
  const [isRequestingDeleteCode, setIsRequestingDeleteCode] = useState(false);
  const [isVerifyingDeleteCode, setIsVerifyingDeleteCode] = useState(false);
  const [deleteCodeVerified, setDeleteCodeVerified] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
    fetch2FAStatus();
    fetchSecurityInfo();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        "http://localhost:8000/users/getmyprofile/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data: UserProfile = await response.json();
      setProfile(data);

      setEditForm({
        username: data.username,
        name: data.name,
        dob: data.dob || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      const response = await fetch("http://localhost:8000/users/preferences", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTheme(data.theme || "dark");
        setNotifications(
          data.notifications || { email: true, push: false, updates: true }
        );
        setLanguage(data.language || "en");
        setTimezone(data.timezone || "(UTC+05:00) Islamabad, Karachi");
        setDateFormat(data.date_format || "MM/DD/YYYY");

        // Also update localStorage for immediate UI updates
        localStorage.setItem("theme", data.theme || "dark");
        document.documentElement.setAttribute(
          "data-theme",
          data.theme || "dark"
        );
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      // Fallback to localStorage
      const savedTheme =
        (localStorage.getItem("theme") as "light" | "dark") || "dark";
      const savedNotifications = localStorage.getItem("notifications");
      const savedLanguage = localStorage.getItem("language") || "en";
      setTheme(savedTheme);
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
      setLanguage(savedLanguage);
    }
  };

  const fetchSecurityInfo = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      const response = await fetch(
        "http://localhost:8000/users/security-info",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSecurityInfo(data);
      }
    } catch (error) {
      console.error("Error fetching security info:", error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      const response = await fetch("http://localhost:8000/users/sessions", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.sessions || []);
        setShowSessionsModal(true);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to fetch active sessions");
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        username: profile.username,
        name: profile.name,
        dob: profile.dob || "",
      });
    }
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    if (profile) {
      setEditForm({
        username: profile.username,
        name: profile.name,
        dob: profile.dob || "",
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const updates: Record<string, string> = {};

      if (editForm.username !== profile.username) {
        updates.username = editForm.username;
      }
      if (editForm.name !== profile.name) {
        updates.name = editForm.name;
      }
      if (editForm.dob !== (profile.dob || "")) {
        updates.dob = editForm.dob;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await fetch(
        `http://localhost:8000/users/${profile.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail ||
            `Failed to update profile: ${response.statusText}`
        );
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access_token);
      accessToken = data.access_token;

      // Update profile with the changes we made (API doesn't return user object)
      setProfile({
        ...profile,
        ...updates,
      });

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        "http://localhost:8000/users/changepassword",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            old_password: passwordForm.oldPassword,
            new_password: passwordForm.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.detail ||
          `Failed to change password: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuccessMessage(data.message || "Password changed successfully!");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      setError((error as Error).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await fetch("http://localhost:8000/users/preferences", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ theme: newTheme }),
        });
      }
    } catch (error) {
      console.error("Error updating theme:", error);
    }

    setSuccessMessage("Theme updated successfully!");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await fetch("http://localhost:8000/users/preferences", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notifications: updated }),
        });
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem("language", newLang);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        await fetch("http://localhost:8000/users/preferences", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ language: newLang }),
        });
      }
    } catch (error) {
      console.error("Error updating language:", error);
    }

    setSuccessMessage("Language updated successfully!");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleLogoutAll = async () => {
    if (
      !confirm(
        "Are you sure you want to sign out from all devices? You will need to log in again on all devices."
      )
    ) {
      return;
    }

    setIsLoggingOutAll(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        "http://localhost:8000/users/sessions/logout-all",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to sign out from all devices"
        );
      }

      setSuccessMessage("Signed out from all devices successfully!");
      setTimeout(() => {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Error signing out:", error);
      setError((error as Error).message);
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const handleDownloadData = async () => {
    setIsDownloadingData(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        "http://localhost:8000/users/download-data",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download data");
      }

      // Get filename from Content-Disposition header, or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `fastcite_user_data_${profile?.username}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage("Data downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error downloading data:", error);
      setError("Failed to download data");
    } finally {
      setIsDownloadingData(false);
    }
  };

  const handleRequestResetCode = async () => {
    if (!profile) return;

    setIsRequestingCode(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `http://localhost:8000/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: profile.username }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset code");
      }

      setSuccessMessage("Reset code sent to your email. Please check your inbox.");
      setShowForgotPasswordField(true);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error requesting reset code:", error);
      setError((error as Error).message);
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!profile || !forgotPasswordCode || forgotPasswordCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifyingCode(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/auth/verify-reset-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: profile.username,
            reset_code: forgotPasswordCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid reset code");
      }

      setSuccessMessage("Code verified! Please enter your new password.");
      setCodeVerified(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error verifying code:", error);
      setError((error as Error).message);
      setForgotPasswordCode("");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResetPasswordFromForgot = async () => {
    if (!profile) return;

    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsResettingPassword(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `http://localhost:8000/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: profile.username,
            reset_code: forgotPasswordCode,
            new_password: forgotNewPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccessMessage("Password reset successfully!");
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordCode("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setShowForgotPasswordField(false);
        setShowForgotPasswordVisibility(false);
        setCodeVerified(false);
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      console.error("Error resetting password:", error);
      setError((error as Error).message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleRequestDeleteCode = async () => {
    if (!profile) return;

    setIsRequestingDeleteCode(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `http://localhost:8000/auth/request-delete-account-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: profile.username }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send deletion code");
      }

      setSuccessMessage("Deletion code sent to your email. Please check your inbox.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error requesting deletion code:", error);
      setError((error as Error).message);
    } finally {
      setIsRequestingDeleteCode(false);
    }
  };

  const handleVerifyDeleteCode = async () => {
    if (!profile || !deleteAccountCode || deleteAccountCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifyingDeleteCode(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `http://localhost:8000/auth/verify-delete-account-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: profile.username,
            deletion_code: deleteAccountCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid deletion code");
      }

      setSuccessMessage("Code verified! Proceeding with account deletion...");
      setDeleteCodeVerified(true);
      setTimeout(() => setSuccessMessage(null), 2000);
      
      // Proceed with account deletion
      await handleDeleteAccount();
    } catch (error) {
      console.error("Error verifying deletion code:", error);
      setError((error as Error).message);
      setDeleteAccountCode("");
    } finally {
      setIsVerifyingDeleteCode(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;

    setIsDeletingAccount(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      // Step 1: Delete all user's books
      setSuccessMessage("Deleting your books...");
      const deleteBooksResponse = await fetch(
        `http://localhost:8000/pdf/user/${profile.id}/all`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!deleteBooksResponse.ok) {
        const errorData = await deleteBooksResponse.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to delete books");
      }

      const booksResult = await deleteBooksResponse.json();
      console.log(`Deleted ${booksResult.deleted_count} books`);

      // Step 2: Delete all user's chat sessions
      setSuccessMessage("Deleting your chat sessions...");
      const deleteChatsResponse = await fetch(
        `http://localhost:8000/chats/user/${profile.id}/all`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!deleteChatsResponse.ok) {
        const errorData = await deleteChatsResponse.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to delete chats");
      }

      const chatsResult = await deleteChatsResponse.json();
      console.log(`Deleted ${chatsResult.deleted_count} chat sessions`);

      // Step 3: Delete the user account
      setSuccessMessage("Deleting your account...");
      const deleteUserResponse = await fetch(
        `http://localhost:8000/users/${profile.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!deleteUserResponse.ok) {
        const errorData = await deleteUserResponse.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to delete account");
      }

      setSuccessMessage("Account and all associated data deleted successfully!");
      setTimeout(() => {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      setError((error as Error).message);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
      setShowDeleteCodeModal(false);
      setDeleteAccountCode("");
      setDeleteCodeVerified(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const fetch2FAStatus = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      const response = await fetch("http://localhost:8000/users/2fa/status", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    }
  };

  const handleGenerate2FA = async () => {
    setIsLoading2FA(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch("http://localhost:8000/users/2fa/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to generate 2FA secret");
      }

      const data = await response.json();
      setQrCodeData(data.qr_code);
      setTwoFactorSecret(data.manual_entry_key);
      setShow2FASetup(true);
    } catch (error) {
      console.error("Error generating 2FA:", error);
      setError((error as Error).message);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch("http://localhost:8000/users/2fa/enable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to enable 2FA");
      }

      setSuccessMessage("2FA enabled successfully!");
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setQrCodeData(null);
      setTwoFactorSecret(null);
      setVerificationCode("");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      setError((error as Error).message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FACode || disable2FACode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading2FA(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch("http://localhost:8000/users/2fa/disable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: disable2FACode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to disable 2FA");
      }

      setSuccessMessage("2FA disabled successfully!");
      setTwoFactorEnabled(false);
      setShowDisable2FA(false);
      setDisable2FACode("");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      setError((error as Error).message);
    } finally {
      setIsLoading2FA(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--color-bg-primary)]">
        <div className="flex-1 flex items-center justify-center">
          <Loader2
            size={48}
            className="animate-spin text-[var(--color-accent-primary)]"
          />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex h-screen bg-[var(--color-bg-primary)]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--color-text-secondary)] mb-4">{error}</p>
            <button onClick={fetchProfile} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar />
      <style>{styles}</style>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]">
          <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Settings
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-8">
          {/* Toast Notifications */}
          {successMessage && (
            <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px]">
                <div className="w-8 h-8 rounded-full bg-green-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {successMessage}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px]">
                <div className="w-8 h-8 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {profile && (
            <div className="grid grid-cols-12 gap-6">
              {/* Sidebar Nav */}
              <div className="col-span-3">
                <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-2">
                  <button
                    onClick={() => setActiveSection("profile")}
                    className={`w-full text-left px-4 py-2.5 rounded font-medium text-sm flex items-center gap-3 ${
                      activeSection === "profile"
                        ? "bg-[var(--color-accent-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveSection("security")}
                    className={`w-full text-left px-4 py-2.5 rounded font-medium text-sm mt-1 flex items-center gap-3 ${
                      activeSection === "security"
                        ? "bg-[var(--color-accent-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <Shield size={16} />
                    Security
                  </button>
                  <button
                    onClick={() => setActiveSection("preferences")}
                    className={`w-full text-left px-4 py-2.5 rounded font-medium text-sm mt-1 flex items-center gap-3 ${
                      activeSection === "preferences"
                        ? "bg-[var(--color-accent-primary)] text-white"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <Palette size={16} />
                    Preferences
                  </button>
                </div>
              </div>

              {/* Main Content */}
              <div className="col-span-9 space-y-6">
                {/* PROFILE SECTION */}
                {activeSection === "profile" && (
                  <div className="space-y-6">
                    {/* Card 1: Profile Settings */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      {/* Profile Header (now part of the same card) */}
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-2xl font-bold">
                              {getInitials(profile.name)}
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                {profile.name}
                              </h2>
                              <p className="text-[var(--color-text-secondary)] text-sm">
                                @{profile.username}
                              </p>
                              <div className="flex items-center gap-2 mt-2"></div>
                            </div>
                          </div>

                          {!isEditing ? (
                            <button
                              onClick={handleEditClick}
                              className="btn-secondary flex items-center gap-2"
                            >
                              <Edit2 size={16} />
                              Edit
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Save size={16} />
                                )}
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Profile Information (The Form) */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5">
                          Profile Information
                        </h3>

                        {/* Improved 2-column grid layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          {/* Full Name Field */}
                          <div className="space-y-1">
                            <label
                              htmlFor="fullName"
                              className="text-sm font-medium text-[var(--color-text-primary)]"
                            >
                              Full Name
                            </label>
                            {isEditing ? (
                              <input
                                id="fullName"
                                type="text"
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    name: e.target.value,
                                  })
                                }
                                className="input-primary w-full"
                              />
                            ) : (
                              <div className="text-[var(--color-text-primary)] py-2 px-3 bg-[var(--color-surface-secondary)] rounded-md min-h-[42px] flex items-center">
                                {profile.name}
                              </div>
                            )}
                          </div>

                          {/* Username Field */}
                          <div className="space-y-1">
                            <label
                              htmlFor="username"
                              className="text-sm font-medium text-[var(--color-text-primary)]"
                            >
                              Username
                            </label>
                            {isEditing ? (
                              <input
                                id="username"
                                type="text"
                                value={editForm.username}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    username: e.target.value,
                                  })
                                }
                                className="input-primary w-full"
                              />
                            ) : (
                              <div className="text-[var(--color-text-primary)] py-2 px-3 bg-[var(--color-surface-secondary)] rounded-md min-h-[42px] flex items-center">
                                {profile.username}
                              </div>
                            )}
                          </div>

                          {/* Date of Birth Field */}
                          <div className="space-y-1">
                            <label
                              htmlFor="dob"
                              className="text-sm font-medium text-[var(--color-text-primary)]"
                            >
                              Date of Birth
                            </label>
                            {isEditing ? (
                              <input
                                id="dob"
                                type="date"
                                value={editForm.dob}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    dob: e.target.value,
                                  })
                                }
                                className="input-primary w-full"
                              />
                            ) : (
                              <div className="text-[var(--color-text-primary)] py-2 px-3 bg-[var(--color-surface-secondary)] rounded-md min-h-[42px] flex items-center">
                                {formatDate(profile.dob)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Account Details (Read-only) */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                          Account Details
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          This information is locked and cannot be changed.
                        </p>
                      </div>

                      {/* Key-Value List for read-only info */}
                      <div className="p-6 space-y-4">
                        {/* Email */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            Email
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {profile.email}
                            </span>
                            <Lock
                              size={12}
                              className="text-[var(--color-text-tertiary)]"
                            />
                          </div>
                        </div>

                        {/* Role */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            Role
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--color-text-secondary)] capitalize">
                              {profile.role}
                            </span>
                            <Lock
                              size={12}
                              className="text-[var(--color-text-tertiary)]"
                            />
                          </div>
                        </div>

                        {/* Divider */}
                        <hr className="border-[var(--color-border-primary)] !my-5" />

                        {/* Account ID */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            Account ID
                          </span>
                          <span className="text-sm text-[var(--color-text-secondary)] font-mono break-all">
                            {profile.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECURITY SECTION */}
                {activeSection === "security" && (
                  <>
                    {/* Change Password */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                          <Lock size={18} />
                          Change Password
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Update your password to keep your account secure
                        </p>
                      </div>

                      <div className="p-6 space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.old ? "text" : "password"}
                              value={passwordForm.oldPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  oldPassword: e.target.value,
                                })
                              }
                              className="input-primary w-full pr-10"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  old: !showPasswords.old,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                            >
                              {showPasswords.old ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  newPassword: e.target.value,
                                })
                              }
                              className="input-primary w-full pr-10"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  new: !showPasswords.new,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                            >
                              {showPasswords.new ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            Must be at least 8 characters long
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className="input-primary w-full pr-10"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  confirm: !showPasswords.confirm,
                                })
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                            >
                              {showPasswords.confirm ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                          {isChangingPassword ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Shield size={16} />
                          )}
                          {isChangingPassword
                            ? "Changing..."
                            : "Change Password"}
                        </button>
                      </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          Security Settings
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Manage your account security preferences
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border-primary)]">
                          <div className="flex items-start gap-3">
                            <Smartphone
                              size={20}
                              className="text-[var(--color-text-secondary)] mt-1"
                            />
                            <div>
                              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                                Two-Factor Authentication
                              </h4>
                              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                {twoFactorEnabled
                                  ? "2FA is enabled on your account"
                                  : "Add an extra layer of security to your account"}
                              </p>
                            </div>
                          </div>
                          {twoFactorEnabled ? (
                            <button
                              onClick={() => setShowDisable2FA(true)}
                              className="px-4 py-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-lg text-sm font-medium border border-red-500"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={handleGenerate2FA}
                              disabled={isLoading2FA}
                              className="btn-secondary text-sm disabled:opacity-50"
                            >
                              {isLoading2FA ? "Loading..." : "Enable"}
                            </button>
                          )}
                        </div>

                        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border-primary)]">
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              size={20}
                              className="text-[var(--color-text-secondary)] mt-1"
                            />
                            <div>
                              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                                Active Sessions
                              </h4>
                              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Manage devices where you're currently logged in
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={fetchActiveSessions}
                            className="btn-secondary text-sm"
                          >
                            View
                          </button>
                        </div>

                        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border-primary)]">
                          <div className="flex items-start gap-3">
                            <LogOut size={20} className="text-red-500 mt-1" />
                            <div>
                              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                                Sign Out All Devices
                              </h4>
                              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Sign out from all devices except this one
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleLogoutAll}
                            disabled={isLoggingOutAll}
                            className="px-4 py-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-lg text-sm font-medium border border-red-500 disabled:opacity-50"
                          >
                            {isLoggingOutAll
                              ? "Signing Out..."
                              : "Sign Out All"}
                          </button>
                        </div>

                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Lock size={20} className="text-[var(--color-text-secondary)] mt-1" />
                            <div>
                              <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                                Forgot Password
                              </h4>
                              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                Reset your password using email verification
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowForgotPassword(true)}
                            className="btn-secondary text-sm"
                          >
                            Reset Password
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Account Security */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          Account Security
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Review your account security status
                        </p>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            Last Password Change
                          </span>
                          <p className="col-span-2 text-sm text-[var(--color-text-secondary)]">
                            {securityInfo?.last_password_change
                              ? formatDate(securityInfo.last_password_change)
                              : "Never changed"}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            Last Login
                          </span>
                          <p className="col-span-2 text-sm text-[var(--color-text-secondary)]">
                            {securityInfo?.last_login
                              ? formatDate(securityInfo.last_login)
                              : "Not available"}
                          </p>
                        </div>
                        {securityInfo?.account_created && (
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">
                              Account Created
                            </span>
                            <p className="col-span-2 text-sm text-[var(--color-text-secondary)]">
                              {formatDate(securityInfo.account_created)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* PREFERENCES SECTION */}
                {activeSection === "preferences" && (
                  <>
                    {/* Appearance */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                          <Palette size={18} />
                          Appearance
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Customize how the interface looks
                        </p>
                      </div>

                      <div className="p-6">
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                            Theme
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => handleThemeChange("light")}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                theme === "light"
                                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] bg-opacity-5"
                                  : "border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded bg-white border border-gray-300 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-gray-100 rounded"></div>
                                </div>
                                <span className="font-medium text-[var(--color-text-primary)]">
                                  Light
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] text-left">
                                Clean and bright interface
                              </p>
                            </button>

                            <button
                              onClick={() => handleThemeChange("dark")}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                theme === "dark"
                                  ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] bg-opacity-5"
                                  : "border-[var(--color-border-primary)] hover:border-[var(--color-border-secondary)]"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded bg-gray-900 border border-gray-700 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-gray-800 rounded"></div>
                                </div>
                                <span className="font-medium text-[var(--color-text-primary)]">
                                  Dark
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] text-left">
                                Easy on the eyes
                              </p>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                          <Bell size={18} />
                          Notifications
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Manage how you receive notifications
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-primary)]">
                          <div>
                            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                              Email Notifications
                            </h4>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              Receive notifications via email
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationChange("email")}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications.email
                                ? "bg-[var(--color-accent-primary)]"
                                : "bg-[var(--color-border-secondary)]"
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifications.email ? "translate-x-6" : ""
                              }`}
                            ></span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-primary)]">
                          <div>
                            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                              Push Notifications
                            </h4>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              Receive push notifications on your device
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationChange("push")}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications.push
                                ? "bg-[var(--color-accent-primary)]"
                                : "bg-[var(--color-border-secondary)]"
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifications.push ? "translate-x-6" : ""
                              }`}
                            ></span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                              Product Updates
                            </h4>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              Receive updates about new features
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationChange("updates")}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              notifications.updates
                                ? "bg-[var(--color-accent-primary)]"
                                : "bg-[var(--color-border-secondary)]"
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                notifications.updates ? "translate-x-6" : ""
                              }`}
                            ></span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Language & Region */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                          <Globe size={18} />
                          Language & Region
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Set your preferred language and region
                        </p>
                      </div>

                      <div className="p-6 space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Language
                          </label>
                          <select
                            value={language}
                            onChange={(e) =>
                              handleLanguageChange(e.target.value)
                            }
                            className="input-primary w-full"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                            <option value="ur">اردو</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Timezone
                          </label>
                          <select
                            value={timezone}
                            onChange={(e) => {
                              setTimezone(e.target.value);
                              const accessToken =
                                localStorage.getItem("accessToken");
                              if (accessToken) {
                                fetch(
                                  "http://localhost:8000/users/preferences",
                                  {
                                    method: "PUT",
                                    headers: {
                                      Authorization: `Bearer ${accessToken}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      timezone: e.target.value,
                                    }),
                                  }
                                ).catch(console.error);
                              }
                            }}
                            className="input-primary w-full"
                          >
                            <option>(UTC+05:00) Islamabad, Karachi</option>
                            <option>(UTC+00:00) London</option>
                            <option>(UTC-05:00) New York</option>
                            <option>(UTC+01:00) Paris</option>
                            <option>(UTC+09:00) Tokyo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Date Format
                          </label>
                          <select
                            value={dateFormat}
                            onChange={(e) => {
                              setDateFormat(e.target.value);
                              const accessToken =
                                localStorage.getItem("accessToken");
                              if (accessToken) {
                                fetch(
                                  "http://localhost:8000/users/preferences",
                                  {
                                    method: "PUT",
                                    headers: {
                                      Authorization: `Bearer ${accessToken}`,
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      date_format: e.target.value,
                                    }),
                                  }
                                ).catch(console.error);
                              }
                            }}
                            className="input-primary w-full"
                          >
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Data & Privacy */}
                    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg">
                      <div className="p-6 border-b border-[var(--color-border-primary)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          Data & Privacy
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                          Control your data and privacy settings
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border-primary)]">
                          <div>
                            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
                              Download Your Data
                            </h4>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              Download a copy of your account data
                            </p>
                          </div>
                          <button
                            onClick={handleDownloadData}
                            disabled={isDownloadingData}
                            className="btn-secondary text-sm disabled:opacity-50"
                          >
                            {isDownloadingData ? "Downloading..." : "Download"}
                          </button>
                        </div>

                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-red-500">
                              Delete Account
                            </h4>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              Permanently delete your account and data
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setShowDeleteCodeModal(true);
                              setShowDeleteConfirm(false);
                              handleRequestDeleteCode();
                            }}
                            className="px-4 py-2 text-red-500 hover:bg-red-500 hover:bg-opacity-10 rounded-lg text-sm font-medium border border-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2FA Setup Modal */}
          {show2FASetup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Enable Two-Factor Authentication
                  </h3>
                  <button
                    onClick={() => {
                      setShow2FASetup(false);
                      setQrCodeData(null);
                      setTwoFactorSecret(null);
                      setVerificationCode("");
                    }}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Scan this QR code with your authenticator app (Google
                    Authenticator, Authy, etc.):
                  </p>
                  {qrCodeData && (
                    <div className="flex justify-center bg-white p-4 rounded-lg">
                      <img
                        src={qrCodeData}
                        alt="2FA QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                  )}
                  {twoFactorSecret && (
                    <div className="bg-[var(--color-surface-secondary)] p-3 rounded-lg">
                      <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                        Or enter this code manually:
                      </p>
                      <p className="text-sm font-mono text-[var(--color-text-primary)] break-all">
                        {twoFactorSecret}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Enter 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="input-primary w-full text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShow2FASetup(false);
                        setQrCodeData(null);
                        setTwoFactorSecret(null);
                        setVerificationCode("");
                      }}
                      className="flex-1 px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnable2FA}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {isVerifying ? "Verifying..." : "Enable 2FA"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disable 2FA Modal */}
          {showDisable2FA && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Disable Two-Factor Authentication
                  </h3>
                  <button
                    onClick={() => {
                      setShowDisable2FA(false);
                      setDisable2FACode("");
                    }}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Please enter your 6-digit authentication code to disable
                    2FA:
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Enter 6-digit code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={disable2FACode}
                      onChange={(e) =>
                        setDisable2FACode(e.target.value.replace(/\D/g, ""))
                      }
                      className="input-primary w-full text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDisable2FA(false);
                        setDisable2FACode("");
                      }}
                      className="flex-1 px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDisable2FA}
                      disabled={isLoading2FA || disable2FACode.length !== 6}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {isLoading2FA ? "Disabling..." : "Disable 2FA"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Sessions Modal */}
          {showSessionsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Active Sessions
                  </h3>
                  <button
                    onClick={() => setShowSessionsModal(false)}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {activeSessions.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                      No active sessions found
                    </p>
                  ) : (
                    activeSessions.map((session, index) => (
                      <div
                        key={index}
                        className="bg-[var(--color-surface-secondary)] p-4 rounded-lg border border-[var(--color-border-primary)]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {session.device || "Unknown Device"}
                            </p>
                            {session.ip_address && (
                              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                IP: {session.ip_address}
                              </p>
                            )}
                            {session.last_activity && (
                              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                Last active:{" "}
                                {new Date(
                                  session.last_activity
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Reset Password
                  </h3>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordCode("");
                      setForgotNewPassword("");
                      setForgotConfirmPassword("");
                      setShowForgotPasswordField(false);
                      setShowForgotPasswordVisibility(false);
                      setCodeVerified(false);
                      setError(null);
                    }}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  {!showForgotPasswordField ? (
                    <>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        We'll send a 6-digit verification code to the email associated with your account ({profile?.email}).
                      </p>
                      <button
                        onClick={handleRequestResetCode}
                        disabled={isRequestingCode}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        {isRequestingCode ? "Sending..." : "Send Reset Code"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
                        <p className="text-sm text-blue-400">
                          Check your email for the 6-digit verification code. The code expires in 10 minutes.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={forgotPasswordCode}
                          onChange={(e) =>
                            setForgotPasswordCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          className="input-primary w-full text-center text-2xl tracking-widest"
                          placeholder="000000"
                        />
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          Enter the 6-digit code from your email
                        </p>
                      </div>

                      {forgotPasswordCode.length === 6 && !codeVerified && (
                        <button
                          onClick={handleVerifyResetCode}
                          disabled={isVerifyingCode}
                          className="btn-secondary w-full disabled:opacity-50"
                        >
                          {isVerifyingCode ? "Verifying..." : "Verify Code"}
                        </button>
                      )}

                      {codeVerified && (
                        <div className="space-y-3 pt-2">
                            <div>
                              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showForgotPasswordVisibility ? "text" : "password"}
                                  value={forgotNewPassword}
                                  onChange={(e) => setForgotNewPassword(e.target.value)}
                                  className="input-primary w-full pr-10"
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowForgotPasswordVisibility(!showForgotPasswordVisibility)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                                >
                                  {showForgotPasswordVisibility ? (
                                    <EyeOff size={18} />
                                  ) : (
                                    <Eye size={18} />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                Must be at least 8 characters long
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                Confirm New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showForgotPasswordVisibility ? "text" : "password"}
                                  value={forgotConfirmPassword}
                                  onChange={(e) =>
                                    setForgotConfirmPassword(e.target.value)
                                  }
                                  className="input-primary w-full pr-10"
                                  placeholder="Confirm new password"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowForgotPasswordVisibility(!showForgotPasswordVisibility)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                                >
                                  {showForgotPasswordVisibility ? (
                                    <EyeOff size={18} />
                                  ) : (
                                    <Eye size={18} />
                                  )}
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={handleResetPasswordFromForgot}
                              disabled={
                                isResettingPassword ||
                                !forgotNewPassword ||
                                forgotNewPassword.length < 8 ||
                                forgotNewPassword !== forgotConfirmPassword
                              }
                              className="btn-primary w-full disabled:opacity-50"
                            >
                              {isResettingPassword ? "Resetting..." : "Reset Password"}
                            </button>
                          </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Code Verification Modal */}
          {showDeleteCodeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-red-500">
                    Verify Account Deletion
                  </h3>
                  <button
                    onClick={() => {
                      setShowDeleteCodeModal(false);
                      setDeleteAccountCode("");
                      setDeleteCodeVerified(false);
                      setError(null);
                    }}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                    <p className="text-sm text-red-400 font-medium mb-2">
                      ⚠️ Warning: This action is permanent
                    </p>
                    <p className="text-xs text-red-300">
                      All your data, including books, chat sessions, and account information, will be permanently deleted and cannot be recovered.
                    </p>
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)]">
                    A 6-digit verification code has been sent to your email ({profile?.email}). Enter the code below to proceed with account deletion.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Deletion Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={deleteAccountCode}
                      onChange={(e) =>
                        setDeleteAccountCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      className="input-primary w-full text-center text-2xl tracking-widest"
                      placeholder="000000"
                      disabled={deleteCodeVerified || isDeletingAccount}
                    />
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      Enter the 6-digit code from your email
                    </p>
                  </div>

                  {!deleteCodeVerified && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleRequestDeleteCode}
                        disabled={isRequestingDeleteCode}
                        className="flex-1 px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {isRequestingDeleteCode ? "Sending..." : "Resend Code"}
                      </button>
                      <button
                        onClick={handleVerifyDeleteCode}
                        disabled={isVerifyingDeleteCode || deleteAccountCode.length !== 6}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {isVerifyingDeleteCode ? "Verifying..." : "Verify & Delete"}
                      </button>
                    </div>
                  )}

                  {deleteCodeVerified && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                      <p className="text-sm text-green-400">
                        ✓ Code verified! Account deletion in progress...
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowDeleteCodeModal(false);
                      setDeleteAccountCode("");
                      setDeleteCodeVerified(false);
                      setError(null);
                    }}
                    className="w-full px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Confirmation Modal (kept for backward compatibility, but not used) */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-red-500">
                    Delete Account
                  </h3>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Are you sure you want to delete your account? This action
                    cannot be undone. All your data will be permanently deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
