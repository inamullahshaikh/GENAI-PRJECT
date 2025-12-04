import React, { useState } from 'react';
// 1. Import useNavigate
import { useNavigate } from 'react-router-dom'; 
import { Eye, EyeOff, Mail, Lock, User, Sparkles, 
Calendar, AlertCircle, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import logo from "../assets/logo.png";

type SignupStep = "form" | "verify" | "complete";

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    dob: '',
    role: 'user'
  });
  const [requiresApproval, setRequiresApproval] = useState(false);

  // 2. Initialize the navigate function
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          dob: formData.dob || null,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send verification code');
      }

      // Move to verification step
      setStep("verify");
      setRequiresApproval(data.requires_approval || false);
      if (data.requires_approval) {
        setSuccessMessage("Verification code sent to your email. After verification, your admin signup request will be reviewed by an administrator.");
      } else {
        setSuccessMessage("Verification code sent to your email. Please check your inbox.");
      }
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // First verify the code
      const verifyResponse = await fetch(`${BACKEND_URL}/auth/verify-signup-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          verification_code: verificationCode,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.detail || 'Invalid verification code');
      }

      // Then complete signup
      const completeResponse = await fetch(`${BACKEND_URL}/auth/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          verification_code: verificationCode,
          username: formData.username,
          password: formData.password,
          name: formData.name,
          dob: formData.dob || null,
          role: formData.role
        }),
      });

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(completeData.detail || 'Failed to create account');
      }

      // Check if approval is required
      if (completeData.requires_approval) {
        // For admin signups, show pending approval message
        setStep("complete");
        setSuccessMessage("Email verified! Your admin signup request is pending approval. You will receive an email once an administrator reviews your request.");
      } else {
        // Regular user - account created
        setStep("complete");
        setSuccessMessage("Account created successfully!");
      }
      
      // Redirect to login after 3 seconds (longer for admin approval message)
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      {/* Header with Logo */}
      <header className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img 
            src={logo}
            alt="ChatAI Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain"
            onError={(e) => {
              // Fallback to gradient icon if image fails to load
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-hover)] rounded-lg items-center justify-center shadow-lg hidden">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">FastCite</span>
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
                    Simplify your research, generate accurate citations, and get AI-powered writing assistance — 
                    all in one place. FastCite helps you focus on learning while we handle the rest.
                </p>
              </div>
              
              {/* Illustration SVG */}
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background glow circles */}
                  <circle cx="200" cy="200" r="180" fill="url(#grad1)" opacity="0.08"/>
                  <circle cx="200" cy="200" r="140" fill="url(#grad2)" opacity="0.12"/>
                  <circle cx="200" cy="200" r="100" fill="url(#grad1)" opacity="0.08"/>
                  
                  {/* Chat bubbles */}
                  <rect x="60" y="100" width="200" height="70" rx="24" fill="var(--color-user-message)" stroke="var(--color-border-secondary)" strokeWidth="1.5"/>
                  <rect x="140" y="190" width="200" height="70" rx="24" fill="var(--color-assistant-message)" stroke="var(--color-border-secondary)" strokeWidth="1.5"/>
                  <rect x="60" y="280" width="200" height="70" rx="24" fill="var(--color-user-message)" stroke="var(--color-border-secondary)" strokeWidth="1.5"/>
                  
                  {/* Lines inside bubbles (message text simulation) */}
                  <line x1="80" y1="120" x2="220" y2="120" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
                  <line x1="80" y1="138" x2="180" y2="138" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
                  <line x1="80" y1="152" x2="200" y2="152" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                  
                  <line x1="160" y1="210" x2="300" y2="210" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
                  <line x1="160" y1="228" x2="260" y2="228" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
                  <line x1="160" y1="242" x2="280" y2="242" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                  
                  <line x1="80" y1="300" x2="220" y2="300" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
                  <line x1="80" y1="318" x2="180" y2="318" stroke="var(--color-text-tertiary)" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
                  <line x1="80" y1="332" x2="200" y2="332" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                  
                  {/* Sparkle accents */}
                  <circle cx="340" cy="130" r="3" fill="var(--color-accent-primary)" opacity="0.8"/>
                  <circle cx="50" cy="230" r="3" fill="var(--color-accent-primary)" opacity="0.8"/>
                  <circle cx="350" cy="310" r="3" fill="var(--color-accent-secondary)" opacity="0.6"/>
                  <circle cx="40" cy="160" r="2" fill="var(--color-accent-hover)" opacity="0.5"/>
                  
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-accent-primary)" />
                      <stop offset="100%" stopColor="var(--color-accent-hover)" />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-accent-hover)" />
                      <stop offset="100%" stopColor="var(--color-accent-secondary)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] p-6 sm:p-8 shadow-2xl">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                      {step === "form" ? "Create Account" : step === "verify" ? "Verify Email" : "Account Created!"}
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
                      {step === "form" 
                        ? "Sign up to start your AI conversation journey"
                        : step === "verify"
                        ? "Enter the verification code sent to your email"
                        : "Your account has been created successfully!"}
                    </p>
                  </div>

                  {/* Success Message */}
                  {successMessage && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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

                  {/* Form Step */}
                  {step === "form" && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Input */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base"
                          placeholder="John Doe"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Username Input */}
                    <div className="space-y-2">
                      <label htmlFor="username" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base"
                          placeholder="johndoe"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base"
                          placeholder="you@example.com"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Date of Birth Input */}
                    <div className="space-y-2">
                      <label htmlFor="dob" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Date of Birth <span className="text-xs text-[var(--color-text-tertiary)]">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                        <input
                          type="date"
                          id="dob"
                          name="dob"
                          value={formData.dob}
                          onChange={handleChange}
                          className="input-primary w-full pl-10 pr-4 py-3 text-sm sm:text-base"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="input-primary w-full pl-10 pr-12 py-3 text-sm sm:text-base"
                          placeholder="••••••••"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                      <label htmlFor="role" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Account Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'user' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.role === 'user'
                              ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                              : 'border-[var(--color-border-primary)] hover:border-[var(--color-accent-primary)]/50'
                          }`}
                          disabled={loading}
                        >
                          <User className={`w-6 h-6 mx-auto mb-2 ${
                            formData.role === 'user' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)]'
                          }`} />
                          <div className={`text-sm font-medium ${
                            formData.role === 'user' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'
                          }`}>
                            User
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            Immediate access
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'admin' })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.role === 'admin'
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-[var(--color-border-primary)] hover:border-purple-500/50'
                          }`}
                          disabled={loading}
                        >
                          <Shield className={`w-6 h-6 mx-auto mb-2 ${
                            formData.role === 'admin' ? 'text-purple-500' : 'text-[var(--color-text-tertiary)]'
                          }`} />
                          <div className={`text-sm font-medium ${
                            formData.role === 'admin' ? 'text-purple-500' : 'text-[var(--color-text-secondary)]'
                          }`}>
                            Admin
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            Requires approval
                          </div>
                        </button>
                      </div>
                      {formData.role === 'admin' && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                          Admin accounts require verification and approval from an existing administrator.
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full py-3 text-sm sm:text-base font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="spinner w-5 h-5"></div>
                          Sending Code...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </button>
                  </form>
                  )}

                  {/* Verification Step */}
                  {step === "verify" && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-400">
                          We've sent a 6-digit verification code to <strong>{formData.email}</strong>. 
                          The code expires in 10 minutes.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="verificationCode"
                          className="block text-sm font-medium text-[var(--color-text-secondary)]"
                        >
                          Verification Code
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                          <input
                            type="text"
                            id="verificationCode"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
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

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setStep("form");
                            setVerificationCode("");
                            setError("");
                          }}
                          className="btn-secondary flex-1"
                          disabled={loading}
                        >
                          <ArrowLeft size={16} className="inline mr-2" />
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || verificationCode.length !== 6}
                          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="spinner w-5 h-5"></div>
                              Verifying...
                            </>
                          ) : (
                            "Verify & Create Account"
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Complete Step */}
                  {step === "complete" && (
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <p className="text-[var(--color-text-primary)]">
                        Redirecting to login...
                      </p>
                    </div>
                  )}

                  {/* Divider */}
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
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </div>

                  {/* Sign In Link */}
                  <div className="text-center text-sm text-[var(--color-text-secondary)]">
                    Already have an account?{' '}
                    <a href="/login" className="link font-medium">
                      Sign in
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}