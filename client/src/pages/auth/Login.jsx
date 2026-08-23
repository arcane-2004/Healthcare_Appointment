import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Activity, Mail, Lock, ArrowRight, Shield, Stethoscope, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');

      // Role-based redirection if default
      if (from === '/') {
        if (user.role === 'admin') navigate('/admin/dashboard');
        else if (user.role === 'doctor') navigate('/doctor/dashboard');
        else navigate('/patient/dashboard');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Demo credential quick-fill
  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-tealAccent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Care<span className="text-primary-600">Sync</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Or{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">
            create a new patient account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md shadow-primary-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Widget */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('patient@example.com', 'Patient@123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-primary-50 text-slate-700 hover:text-primary-700 border border-slate-200 text-center transition flex flex-col items-center gap-1"
              >
                <User className="w-4 h-4 text-primary-600" />
                <span className="text-[11px] font-bold">Patient</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('rahul.sharma@example.com', 'Doctor@123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-tealAccent-50 text-slate-700 hover:text-tealAccent-700 border border-slate-200 text-center transition flex flex-col items-center gap-1"
              >
                <Stethoscope className="w-4 h-4 text-tealAccent-600" />
                <span className="text-[11px] font-bold">Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@example.com', 'Admin@123')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 text-center transition flex flex-col items-center gap-1"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
