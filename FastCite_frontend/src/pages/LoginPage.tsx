import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Sparkles,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import logo from "../assets/logo.png";

type LoginStep = "username" | "password" | "2fa" | "forgot-password" | "verify-code" | "reset-password";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("username");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Check if 2FA is enabled for this username
      const response = await fetch(`${BACKEND_URL}/auth/check-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!data.username_exists) {
        setError("Username not found");
        setLoading(false);
        return;
      }

      setTwoFactorEnabled(data.two_factor_enabled);

      if (data.two_factor_enabled) {
        setStep("2fa");
      } else {
        setStep("password");
      }
    } catch (err) {
      setError("Failed to check account status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }

      // Login successful
      localStorage.setItem("accessToken", data.access_token);
      
      // Check if user is admin and redirect accordingly
      try {
        const profileResponse = await fetch(`${BACKEND_URL}/users/getmyprofile/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          if (userData.role === "admin") {
            window.location.href = "/admin/dashboard";
            return;
          }
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      }
      
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your password.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login-2fa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          two_factor_code: twoFactorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid 2FA code");
      }

      // Login successful
      localStorage.setItem("accessToken", data.access_token);
      
      // Check if user is admin and redirect accordingly
      try {
        const profileResponse = await fetch(`${BACKEND_URL}/users/getmyprofile/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          if (userData.role === "admin") {
            window.location.href = "/admin/dashboard";
            return;
          }
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      }
      
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Invalid 2FA code. Please try again.");
      setTwoFactorCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("username");
    setError("");
    setPassword("");
    setTwoFactorCode("");
    setTwoFactorEnabled(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send reset code");
      }

      setStep("verify-code");
      setSuccessMessage("Reset code sent to your email. Please check your inbox.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          reset_code: resetCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid reset code");
      }

      setStep("reset-password");
    } catch (err: any) {
      setError(err.message || "Invalid reset code. Please try again.");
      setResetCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          reset_code: resetCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        setStep("username");
        setUsername("");
        setResetCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (step) {
      case "username":
        return (
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base"
                  placeholder="johndoe"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="btn-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        );

      case "password":
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Signing in as
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {username}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-primary w-full pl-10 pr-12 py-3 text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setStep("forgot-password");
                  setError("");
                }}
                className="text-sm text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        );

      case "2fa":
        return (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Signing in as
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {username}
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-400">
                Two-factor authentication is enabled. Please enter the 6-digit
                code from your authenticator app.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="twoFactorCode"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Authentication Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || twoFactorCode.length !== 6}
              className="btn-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </button>
          </form>
        );

      case "forgot-password":
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setStep("username");
                  setError("");
                }}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Reset password for
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {username}
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-400">
                We'll send a 6-digit verification code to the email associated with this account.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </button>
          </form>
        );

      case "verify-code":
        return (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setStep("forgot-password");
                  setError("");
                  setResetCode("");
                }}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Verifying code for
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {username}
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-400">
                Check your email for the 6-digit verification code. The code expires in 10 minutes.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="resetCode"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Verification Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  id="resetCode"
                  value={resetCode}
                  onChange={(e) =>
                    setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Enter the 6-digit code from your email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || resetCode.length !== 6}
              className="btn-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>
          </form>
        );

      case "reset-password":
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setStep("verify-code");
                  setError("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Setting new password for
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {username}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-primary w-full pl-10 pr-12 py-3 text-sm sm:text-base"
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-primary w-full pl-10 pr-12 py-3 text-sm sm:text-base"
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword.length < 8 || newPassword !== confirmNewPassword}
              className="btn-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      {/* Header with Logo */}
      <header className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src={logo}
            alt="FastCite Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-hover)] rounded-lg items-center justify-center shadow-lg hidden">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
            FastCite
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-bold text-[var(--color-text-primary)] leading-tight">
                  Study Smarter, Grade Higher with FastCite
                </h1>
                <p className="text-lg xl:text-xl text-[var(--color-text-secondary)] leading-relaxed">
                  Simplify your research, generate accurate citations, and get
                  AI-powered writing assistance — all in one place. FastCite
                  helps you focus on learning while we handle the rest.
                </p>
              </div>

              {/* Illustration SVG */}
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="url(#grad1)"
                    opacity="0.08"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="140"
                    fill="url(#grad2)"
                    opacity="0.12"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="100"
                    fill="url(#grad1)"
                    opacity="0.08"
                  />

                  <rect
                    x="60"
                    y="100"
                    width="200"
                    height="70"
                    rx="24"
                    fill="var(--color-user-message)"
                    stroke="var(--color-border-secondary)"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="140"
                    y="190"
                    width="200"
                    height="70"
                    rx="24"
                    fill="var(--color-assistant-message)"
                    stroke="var(--color-border-secondary)"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="60"
                    y="280"
                    width="200"
                    height="70"
                    rx="24"
                    fill="var(--color-user-message)"
                    stroke="var(--color-border-secondary)"
                    strokeWidth="1.5"
                  />

                  <line
                    x1="80"
                    y1="120"
                    x2="220"
                    y2="120"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <line
                    x1="80"
                    y1="138"
                    x2="180"
                    y2="138"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <line
                    x1="80"
                    y1="152"
                    x2="200"
                    y2="152"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.3"
                  />

                  <line
                    x1="160"
                    y1="210"
                    x2="300"
                    y2="210"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <line
                    x1="160"
                    y1="228"
                    x2="260"
                    y2="228"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <line
                    x1="160"
                    y1="242"
                    x2="280"
                    y2="242"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.3"
                  />

                  <line
                    x1="80"
                    y1="300"
                    x2="220"
                    y2="300"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                  <line
                    x1="80"
                    y1="318"
                    x2="180"
                    y2="318"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <line
                    x1="80"
                    y1="332"
                    x2="200"
                    y2="332"
                    stroke="var(--color-text-tertiary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.3"
                  />

                  <circle
                    cx="340"
                    cy="130"
                    r="3"
                    fill="var(--color-accent-primary)"
                    opacity="0.8"
                  />
                  <circle
                    cx="50"
                    cy="230"
                    r="3"
                    fill="var(--color-accent-primary)"
                    opacity="0.8"
                  />
                  <circle
                    cx="350"
                    cy="310"
                    r="3"
                    fill="var(--color-accent-secondary)"
                    opacity="0.6"
                  />
                  <circle
                    cx="40"
                    cy="160"
                    r="2"
                    fill="var(--color-accent-hover)"
                    opacity="0.5"
                  />

                  <defs>
                    <linearGradient
                      id="grad1"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-accent-primary)"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-accent-hover)"
                      />
                    </linearGradient>
                    <linearGradient
                      id="grad2"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="var(--color-accent-hover)" />
                      <stop
                        offset="100%"
                        stopColor="var(--color-accent-secondary)"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] p-6 sm:p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                      {step === "username"
                        ? "Sign In"
                        : step === "password"
                        ? "Enter Password"
                        : step === "2fa"
                        ? "Two-Factor Authentication"
                        : step === "forgot-password"
                        ? "Forgot Password"
                        : step === "verify-code"
                        ? "Verify Code"
                        : "Reset Password"}
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                      {step === "username"
                        ? "Welcome back! Please sign in to your account."
                        : step === "password"
                        ? "Enter your password to continue"
                        : step === "2fa"
                        ? "Enter the code from your authenticator app"
                        : step === "forgot-password"
                        ? "We'll send a verification code to your email"
                        : step === "verify-code"
                        ? "Enter the code sent to your email"
                        : "Enter your new password"}
                    </p>
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-400">{successMessage}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Form */}
                  {renderForm()}

                  {/* Divider - Only show on username step */}
                  {step === "username" && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[var(--color-border-primary)]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs sm:text-sm">
                          <span className="px-2 bg-[var(--color-surface-primary)] text-[var(--color-text-tertiary)]">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      {/* Social Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="btn-secondary w-full py-3 text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </button>
                      </div>

                      {/* Sign Up Link */}
                      <div className="text-center text-sm text-[var(--color-text-secondary)]">
                        Don't have an account?{" "}
                        <a href="/signup" className="link font-medium">
                          Sign up
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
