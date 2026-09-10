import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { loginAdmin, showToast } = useApp();

  const [email, setEmail] = useState('admin@ammaspastries.in');
  const [password, setPassword] = useState('Admin@12345');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/admin/login', { email, password });
      if (res.data?.success) {
        loginAdmin(res.data.data.admin, res.data.data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Invalid administrator credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/80 shadow-warm-lg space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-chocolate to-amber-900 text-amber-300 font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            A
          </div>
          <h1 className="font-serif text-2xl font-bold text-chocolate">
            Ammas Admin Portal
          </h1>
          <p className="text-xs text-slate-500">
            Secure bakery management, sales analytics & order fulfillment
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Development Admin Account</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Email: <strong>admin@ammaspastries.in</strong> | Password: <strong>Admin@12345</strong>
          </div>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Master Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-chocolate to-amber-950 hover:from-black hover:to-chocolate text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Access Admin Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLoginPage;
