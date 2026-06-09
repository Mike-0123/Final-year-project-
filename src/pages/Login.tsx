import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { setDemoMode, setToken, setUser, setRefreshToken } from '../services/storage';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      const { access, refresh, user } = res.data;
      const role = user.role.toLowerCase() as 'supplier' | 'seller' | 'admin';
      setToken(access);
      setRefreshToken(refresh);
      setUser({ email: user.email, role });
      navigate(`/${role}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { non_field_errors?: string[]; detail?: string } } };
      const msg =
        e.response?.data?.non_field_errors?.[0] ||
        e.response?.data?.detail ||
        'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSupplier = () => {
    setDemoMode(true);
    setToken('demo-token-replace-with-real-jwt');
    setRefreshToken('demo-refresh-token');
    setUser({ id: 1, name: 'Demo Supplier', email: 'supplier@milk.rw', role: 'supplier' });
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-white/5 rounded-full blur-3xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-blue-950/40 w-full max-w-md p-8 border border-blue-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🥛</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-950">Milk Quality System</h1>
          <p className="text-blue-900/60 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleDemoSupplier}
            className="w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold py-2.5 rounded-lg transition"
          >
            Open Public Demo Dashboard
          </button>
        </form>

        {/* Simulation terminal link */}
        <div className="mt-4 rounded-xl bg-gray-900 border border-emerald-500/30 p-4 text-center">
          <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest mb-1">⚗ IoT Simulation Terminal</p>
          <p className="text-gray-400 text-xs mb-3">Test the ML model with live sensor data — no login required</p>
          <Link
            to="/simulation"
            className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm transition tracking-wide"
          >
            Open Simulation →
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-700 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
