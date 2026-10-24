import React, { useState } from 'react';
import { Mail, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { isSupabaseConfigured, resetPasswordForEmail } from '../utils/supabaseClient.ts';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!isSupabaseConfigured) {
      setStatusMessage({
        type: 'error',
        text: 'Supabase Auth is not configured in this environment (missing VITE_SUPABASE_URL). Live email dispatch requires cloud auth setup.',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordForEmail(email.trim());
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Password reset instructions dispatched to ${email.trim()}. Please inspect your inbox.`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to request password reset.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error sending password reset request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#171A1E] border border-[#262A30] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-[#F5F7FA]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A1A8B3] hover:text-[#F5F7FA] p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-[#F5F7FA]">Reset Password</h3>
        <p className="text-xs text-[#A1A8B3] mt-1">
          Enter the email associated with your POLYVEX cloud account to receive a secure password recovery link.
        </p>

        {statusMessage && (
          <div
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
            <label className="block text-xs font-semibold text-[#F5F7FA] mb-1">
              Account Email
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090B0D] border border-[#262A30] text-[#F5F7FA] placeholder-[#64748B] text-sm focus:outline-none focus:border-[#35F2D0] transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A1A8B3] hover:text-[#F5F7FA] bg-[#090B0D] border border-[#262A30] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#090B0D] bg-[#35F2D0] hover:bg-[#35F2D0]/90 transition shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? <span>Sending...</span> : (
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
