import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (!uidb64 || !token) {
      setError('Invalid reset link.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword({ uidb64, token, new_password: form.new_password });
      setMessage('Password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { token?: string; detail?: string } } };
      setError(e.response?.data?.token || e.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-white/5 rounded-full blur-3xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-blue-950/40 w-full max-w-md p-8 border border-blue-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-950">Reset Password</h1>
          <p className="text-blue-900/60 text-sm mt-1">Enter your new password below</p>
        </div>

        {error && <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" name="new_password" value={form.new_password} onChange={handleChange} required placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} required placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
