import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  HardDrive,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PolyvexLogo } from './PolyvexLogo.tsx';
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from '../utils/auth.ts';

interface SignUpScreenProps {
  onSuccess: (userData: { email: string; name: string; uid?: string; onboardingCompleted?: boolean }) => void;
  onNavigateToLogin: () => void;
  onContinueLocal: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSuccess,
  onNavigateToLogin,
  onContinueLocal,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email format (e.g. name@university.edu).';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters long.';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeTerms) {
      errs.terms = 'Please accept the academic terms of service.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const { user, profile } = await signUpWithEmail(email, password, fullName);
      onSuccess({
        email: user.email || email.trim(),
        name: fullName.trim(),
        uid: user.uid,
        onboardingCompleted: profile.onboardingCompleted,
      });
    } catch (err: any) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthError(null);
    setGoogleLoading(true);

    try {
      const { user, profile } = await signInWithGoogle();
      onSuccess({
        email: user.email || '',
        name: profile.displayName || user.displayName || 'Scholar',
        uid: user.uid,
        onboardingCompleted: profile.onboardingCompleted,
      });
    } catch (err: any) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0D] text-[#F5F7FA] flex flex-col justify-between px-4 py-8 selection:bg-[#35F2D0]/20 selection:text-[#35F2D0]">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-6 border-b border-[#262A30]">
        <PolyvexLogo size={32} showWordmark={true} />
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-xs font-semibold text-[#35F2D0] hover:text-[#35F2D0]/80 transition cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#35F2D0] to-transparent opacity-80" />

          {/* Title Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#090B0D] text-[#35F2D0] border border-[#262A30] mb-3">
              <ShieldCheck className="w-3 h-3" />
              <span>POLYVEX CLOUD ACCOUNT</span>
            </div>
            <h1 className="text-2xl font-black text-[#F5F7FA] tracking-tight font-sans">
              Create your account
            </h1>
            <p className="text-xs text-[#A1A8B3] mt-1.5">
              Start building your clean academic workspace on POLYVEX.
            </p>
          </div>

          {/* Social Sign-In: Google */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] text-xs font-semibold hover:border-[#35F2D0]/50 hover:bg-[#1a1e24] transition disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#35F2D0]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-[#262A30]" />
            <span className="flex-shrink mx-3 text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
              Or with email
            </span>
            <div className="flex-grow border-t border-[#262A30]" />
          </div>

          {/* Authentication Error Alert */}
          {authError && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-300">Registration Error</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-rose-200/90">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name Field */}
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Scholar"
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.fullName ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] focus:ring-1 focus:ring-[#35F2D0]/50 transition`}
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.email ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] focus:ring-1 focus:ring-[#35F2D0]/50 transition`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.password ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] focus:ring-1 focus:ring-[#35F2D0]/50 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#F5F7FA] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] focus:ring-1 focus:ring-[#35F2D0]/50 transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#F5F7FA] cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#262A30] bg-[#090B0D] text-[#35F2D0] focus:ring-[#35F2D0]/40"
                />
                <span className="text-[11px] text-[#A1A8B3] leading-relaxed">
                  I agree to use POLYVEX for academic coursework and comply with the student terms of service.
                </span>
              </label>
              {errors.terms && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-[0_0_20px_rgba(53,242,208,0.25)] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#090B0D]" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Local Guest Mode Link */}
          <div className="mt-5 pt-5 border-t border-[#262A30] text-center">
            <button
              type="button"
              onClick={onContinueLocal}
              className="inline-flex items-center gap-1.5 text-xs text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Continue in Local Workspace mode (Guest / Offline)</span>
            </button>
          </div>
        </div>

        {/* Existing account navigation link */}
        <p className="text-center text-xs text-[#A1A8B3] mt-5">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#35F2D0] font-semibold hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-6 border-t border-[#262A30] text-center text-xs text-[#64748B]">
        POLYVEX • “Your potential. Without limits.”
      </footer>
    </div>
  );
};
