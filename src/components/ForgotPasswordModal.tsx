import React, { useState } from 'react';
import { Mail, X, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { sendPasswordReset, getAuthErrorMessage } from '../utils/auth.ts';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);

    try {
      await sendPasswordReset(cleanEmail);
      setStatusMessage({
        type: 'success',
        text: `Password recovery link dispatched to ${cleanEmail}. Please check your inbox and spam folder.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: getAuthErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStatusMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-[#F5F7FA]">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-[#A1A8B3] hover:text-[#F5F7FA] p-1.5 rounded-lg hover:bg-[#262A30]/60 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="forgot-password-title" className="text-lg font-bold text-[#F5F7FA]">
          Reset Password
        </h3>
        <p className="text-xs text-[#A1A8B3] mt-1">
          Enter your registered POLYVEX account email to receive a secure password reset link.
        </p>

        {statusMessage && (
          <div
            role="alert"
            className={`mt-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-[11px] leading-relaxed">{statusMessage.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-xs font-semibold text-[#F5F7FA] mb-1">
              Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A1A8B3] hover:text-[#F5F7FA] bg-[#090B0D] border border-[#262A30] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#090B0D] bg-[#35F2D0] hover:bg-[#35F2D0]/90 transition shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Email</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
