import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  HardDrive,
  Info
} from 'lucide-react';
import { PolyvexLogo } from './PolyvexLogo.tsx';
import { isSupabaseConfigured, signUpWithEmail } from '../utils/supabaseClient.ts';

interface SignUpScreenProps {
  onSuccess: (userData: { email: string; name: string }) => void;
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
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

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
      errs.terms = 'You must agree to the academic terms and privacy policy.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setConfirmationNotice(null);

    if (!validate()) return;

    // Check if Supabase Cloud Auth is configured
    if (!isSupabaseConfigured) {
      setAuthError(
        'Supabase Cloud Auth is not configured in this environment (missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY). You can proceed right away using Local Workspace mode.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await signUpWithEmail(email.trim(), password, fullName.trim());

      if (!res.success) {
        setAuthError(res.error || 'Failed to create account.');
      } else if (res.isConfirmationPending) {
        setConfirmationNotice(
          `Confirmation email sent to ${email.trim()}. Please verify your email before logging in, or continue with local workspace in the meantime.`
        );
      } else {
        onSuccess({ email: email.trim(), name: fullName.trim() });
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0D] text-[#F5F7FA] flex flex-col justify-between px-4 py-8 selection:bg-[#35F2D0]/20 selection:text-[#35F2D0]">
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pb-6 border-b border-[#262A30]">
        <PolyvexLogo size={32} showWordmark={true} />
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-xs font-semibold text-[#35F2D0] hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-[#F5F7FA] font-sans">
              Create your account
            </h1>
            <p className="text-xs text-[#A1A8B3] mt-1.5">
              Start building your clean academic workspace on Polyvex.
            </p>
          </div>

          {/* Cloud Auth Status Banner */}
          {!isSupabaseConfigured && (
            <div className="mb-5 p-3 rounded-xl bg-[#090B0D] border border-amber-500/30 text-amber-200/90 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Notice on Cloud Accounts:</span>
                <p className="mt-0.5 text-[11px] text-stone-300 leading-relaxed">
                  Supabase environment variables are currently unconfigured. You can switch to <button type="button" onClick={onContinueLocal} className="text-[#35F2D0] underline font-medium hover:text-[#35F2D0]/80">Local Workspace Mode</button> to use all features immediately with offline browser storage.
                </p>
              </div>
            </div>
          )}

          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{authError}</p>
                {!isSupabaseConfigured && (
                  <button
                    type="button"
                    onClick={onContinueLocal}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#35F2D0] text-[#090B0D] font-bold text-xs"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Proceed in Local Mode</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {confirmationNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Email Dispatched</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{confirmationNotice}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Okafor"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.fullName ? 'border-rose-500' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition`}
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.email ? 'border-rose-500' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.password ? 'border-rose-500' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#F5F7FA]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-[#F5F7FA] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090B0D] border ${
                    errors.confirmPassword ? 'border-rose-500' : 'border-[#262A30]'
                  } text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#F5F7FA]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#262A30] bg-[#090B0D] text-[#35F2D0] focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-[11px] text-[#A1A8B3] leading-relaxed">
                  I agree to Polyvex’s academic integrity policies, Terms of Service, and local privacy terms.
                </span>
              </label>
              {errors.terms && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#35F2D0] text-[#090B0D] font-bold text-xs hover:bg-[#35F2D0]/90 transition shadow-[0_0_15px_rgba(53,242,208,0.3)] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Fallback to Local Mode */}
          <div className="mt-5 pt-5 border-t border-[#262A30] text-center">
            <button
              type="button"
              onClick={onContinueLocal}
              className="inline-flex items-center gap-1.5 text-xs text-[#A1A8B3] hover:text-[#35F2D0] transition cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Or use Local Workspace without an account</span>
            </button>
          </div>
        </div>

        {/* Existing account link */}
        <p className="text-center text-xs text-[#A1A8B3] mt-5">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#35F2D0] font-semibold hover:underline cursor-pointer"
          >
            Log In
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto pt-6 border-t border-[#262A30] text-center text-xs text-[#64748B]">
        POLYVEX • “Your potential. Without limits.”
      </div>
    </div>
  );
};
