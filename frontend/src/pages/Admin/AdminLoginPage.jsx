import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import brandLogo from '../../assets/logo.png';
import { Lock, Mail, User, ArrowRight, UserPlus, LogIn, KeyRound, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { adminToken, loginAdmin, showToast } = useApp();

  // If already logged in, automatically proceed to admin dashboard
  React.useEffect(() => {
    if (adminToken) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [adminToken, navigate]);

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);

  // --- LOGIN ---
  const handleAdminLogin = async (e, customEmail = null, customPassword = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);

    const emailToUse = (customEmail !== null ? customEmail : loginEmail).trim();
    const passwordToUse = customPassword !== null ? customPassword : loginPassword;

    try {
      const res = await api.post('/admin/login', {
        email: emailToUse,
        password: passwordToUse,
      });

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

  // --- REGISTER ---
  const handleAdminRegister = async (e) => {
    e.preventDefault();

    if (regPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/register', {
        name: regName.trim() || 'Administrator',
        email: regEmail.trim(),
        password: regPassword,
      });

      if (res.data?.success) {
        showToast('Administrator account created successfully! 🎉', 'success');
        loginAdmin(res.data.data.admin, res.data.data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to create administrator account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD: SEND OTP ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your administrator email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/forgot-password', {
        email: forgotEmail.trim(),
      });

      if (res.data?.success) {
        setOtpSent(true);
        if (res.data.data?.dev_otp) {
          setDevOtpHint(res.data.data.dev_otp);
          showToast(`Development OTP: ${res.data.data.dev_otp}`, 'info');
        } else {
          showToast('OTP sent to your email address! Check your inbox.', 'success');
        }
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to send OTP. Please check your email address.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD: RESET WITH OTP ---
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      showToast('Please enter the 6-digit OTP received in your email.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/reset-password', {
        email: forgotEmail.trim(),
        otp: otp.trim(),
        password: newPassword,
      });

      if (res.data?.success) {
        showToast('Password reset successfully! Please sign in with your new password.', 'success');
        setLoginEmail(forgotEmail);
        setMode('login');
        setOtpSent(false);
        setOtp('');
        setDevOtpHint('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to reset password. Please verify the OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200/80 shadow-warm-lg space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <img
            src={brandLogo}
            alt="Ammas Pastries"
            className="h-14 sm:h-16 w-auto object-contain mx-auto transition-transform duration-300 hover:scale-105"
          />
          <h1 className="font-serif text-2xl font-bold text-chocolate">
            Ammas Admin Portal
          </h1>
          <p className="text-xs text-slate-500">
            Secure bakery management, sales analytics & order fulfillment
          </p>
        </div>

        {/* Tab Switcher (Visible in login & register modes) */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-chocolate shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-chocolate shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* ================= MODE 1: LOGIN ================= */}
        {mode === 'login' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">

            {/* Quick Demo Login Presets for Team / Colleagues */}
            <div className="p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/60 rounded-2xl border border-amber-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Team / Demo Access
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-200/70 font-bold px-2 py-0.5 rounded-full">
                  1-Click Sign In
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleAdminLogin(null, 'mkumar200418@gmail.com', 'Admin@123')}
                  className="p-2.5 bg-white hover:bg-amber-50/80 border border-amber-200/90 hover:border-amber-400 text-left rounded-xl transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-chocolate group-hover:text-amber-950 flex items-center gap-1">
                    <span>👑 Super Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">mkumar200418@...</div>
                  <div className="text-[9px] text-amber-700 font-mono mt-0.5 font-bold">Admin@123</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminLogin(null, 'test1@gmail.com', 'Admin@123')}
                  className="p-2.5 bg-white hover:bg-amber-50/80 border border-amber-200/90 hover:border-amber-400 text-left rounded-xl transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-amber-950 flex items-center gap-1">
                    <span>🏬 Sub-Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">test1@gmail.com</div>
                  <div className="text-[9px] text-amber-700 font-mono mt-0.5 font-bold">Admin@123</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter administrator email"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setMode('forgot');
                  }}
                  className="text-[11px] text-amber-800 hover:text-amber-950 font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-chocolate to-amber-950 hover:from-black hover:to-chocolate text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Access Admin Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-amber-900 hover:text-amber-700 font-semibold hover:underline cursor-pointer"
              >
                Need to set up an account? Create Account →
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE 2: REGISTER ================= */}
        {mode === 'register' && (
          <form onSubmit={handleAdminRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Administrator Name"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Enter administrator email"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-chocolate to-amber-950 hover:from-black hover:to-chocolate text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-amber-900 hover:text-amber-700 font-semibold hover:underline cursor-pointer"
              >
                Already have an account? Sign In →
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE 3: FORGOT PASSWORD ================= */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setOtpSent(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="font-serif font-bold text-base text-chocolate">
                Reset Administrator Password
              </h2>
            </div>

            {!otpSent ? (
              /* Step 1: Send OTP */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your registered administrator email address to receive a secure 6-digit OTP to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter registered administrator email"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-chocolate to-amber-950 hover:from-black hover:to-chocolate text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Sending OTP to Email...' : 'Send Password Reset OTP'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-amber-900 hover:text-amber-700 font-semibold hover:underline cursor-pointer"
                  >
                    Remember your password? Sign In →
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Verify OTP & New Password */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>OTP Sent Successfully</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    A 6-digit OTP was sent to <strong>{forgotEmail}</strong>. Valid for 15 minutes.
                  </p>
                  {devOtpHint && (
                    <div className="pt-1 text-[11px] font-mono text-amber-900 bg-amber-100/70 px-2 py-1 rounded">
                      Local Development OTP: <strong>{devOtpHint}</strong>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-lg tracking-widest font-mono font-bold p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-chocolate to-amber-950 hover:from-black hover:to-chocolate text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Resetting Password...' : 'Reset Password & Sign In'}</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                  >
                    ← Re-send OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setOtpSent(false);
                    }}
                    className="text-xs text-amber-900 hover:text-amber-700 font-semibold hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminLoginPage;
