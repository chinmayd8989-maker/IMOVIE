import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Film, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract redirect url if available
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await login(email, password);
      if (res.success) {
        showToast(`Welcome back, ${res.user.name}!`, 'success');
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credential shortcuts
  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0E131E] border border-[#1A2234] rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#B81D24] to-[#E50914] flex items-center justify-center mx-auto shadow-lg shadow-[#E50914]/25">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign In to IMovies</h1>
          <p className="text-xs text-slate-400">
            Access your bookings, saved seats, and instant reservation passes.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3.5 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#141B29] border border-[#222E46] rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#141B29] border border-[#222E46] rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#E50914] hover:bg-[#B81D24] shadow-lg shadow-[#E50914]/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="pt-2 border-t border-[#182133] space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@imovies.com', 'AdminPassword123!')}
              className="p-2.5 rounded-xl bg-[#141B29] hover:bg-[#1C2538] border border-[#222E46] text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">admin@imovies.com</p>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('alex@imovies.com', 'DemoUser123!')}
              className="p-2.5 rounded-xl bg-[#141B29] hover:bg-[#1C2538] border border-[#222E46] text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Demo User</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">alex@imovies.com</p>
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirectPath)}`} className="text-[#FF4C61] font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
