import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScissorsIcon, ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useThemeStore } from '../../store/themeStore';

export default function ForgotPasswordPage() {
  const { initTheme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugUrl, setDebugUrl] = useState(null);

  useEffect(() => { initTheme(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await authAPI.forgotPassword(email.trim().toLowerCase());
      toast.success(data.message || 'Check your email for the reset link');
      setSubmitted(true);
      // If backend exposed a debug URL (no SMTP / dev), show it so the admin can still proceed
      if (data?.debug?.resetUrl) setDebugUrl(data.debug.resetUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <ScissorsIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="text-primary-200 mt-1">We'll email you a reset link</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full">
                <EnvelopeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Check your email</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                If <span className="font-medium">{email}</span> matches an active account, we've sent a
                password reset link there. The link expires in 60 minutes.
              </p>
              {debugUrl && (
                <div className="text-left bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs">
                  <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                    Email delivery skipped (SMTP not configured)
                  </p>
                  <p className="text-amber-700 dark:text-amber-200 mb-2">
                    Use this link directly to reset your password:
                  </p>
                  <a
                    href={debugUrl}
                    className="font-mono text-primary-700 dark:text-primary-300 break-all hover:underline"
                  >
                    {debugUrl}
                  </a>
                </div>
              )}
              <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter the email address associated with your account. We'll send you a link to reset your password.
              </p>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center py-2.5"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
              <Link
                to="/admin/login"
                className="flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
