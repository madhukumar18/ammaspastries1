import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { Lock, Phone, Mail, ArrowRight, UserPlus, ShieldCheck, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, showToast } = useApp();

  // Active tab: 'otp' | 'password' | 'register'
  const [authMode, setAuthMode] = useState('otp');

  // Option 1: Mobile + OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);

  // Option 2: Email + Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);

  // Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    setLoadingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', { phone });
      if (res.data?.success) {
        setOtpSent(true);
        if (res.data.data?.dev_otp) {
          setDevOtpHint(res.data.data.dev_otp);
          showToast(`Development OTP: ${res.data.data.dev_otp}`, 'info');
        } else {
          showToast('OTP sent to your mobile number!', 'success');
        }
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to send OTP.', 'error');
    } finally {
      setLoadingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast('Please enter the 6-digit OTP.', 'error');
      return;
    }

    setLoadingOtp(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      if (res.data?.success) {
        loginUser(res.data.data.user, res.data.data.token);
        navigate(location.state?.from || '/account');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Invalid OTP. Please try again.', 'error');
    } finally {
      setLoadingOtp(false);
    }
  };

  // Email + Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoadingPass(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        loginUser(res.data.data.user, res.data.data.token);
        navigate(location.state?.from || '/account');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Invalid login credentials.', 'error');
    } finally {
      setLoadingPass(false);
    }
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoadingReg(true);
    try {
      const res = await api.post('/auth/register', {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      if (res.data?.success) {
        loginUser(res.data.data.user, res.data.data.token);
        navigate('/account');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Registration failed. Please check your details.', 'error');
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-md">
          A
        </div>
        <h1 className="font-serif text-2xl font-bold text-chocolate">
          Customer Portal
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to track orders, save cakes to wishlist, and view order history
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm space-y-6">
        <div className="flex border-b border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('otp')}
            className={`flex-1 pb-3 text-center transition-colors border-b-2 ${
              authMode === 'otp'
                ? 'border-amber-600 text-chocolate'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('password')}
            className={`flex-1 pb-3 text-center transition-colors border-b-2 ${
              authMode === 'password'
                ? 'border-amber-600 text-chocolate'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 pb-3 text-center transition-colors border-b-2 ${
              authMode === 'register'
                ? 'border-amber-600 text-chocolate'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Option 1: Mobile + OTP Form */}
        {authMode === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10 font-medium"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {loadingOtp ? 'Sending One-Time Password...' : 'Send OTP →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {devOtpHint && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <strong>Local Dev Mode OTP:</strong> {devOtpHint}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit OTP Sent to {phone}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-lg tracking-widest font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {loadingOtp ? 'Verifying...' : 'Verify OTP & Sign In'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    ← Change Phone Number
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Option 2: Email + Password Form */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingPass}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loadingPass ? 'Authenticating...' : 'Sign In with Password'}
            </button>
          </form>
        )}

        {/* Option 3: Registration Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingReg}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loadingReg ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Option 4: Guest Checkout Option */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <div className="text-xs text-slate-400">Prefer not to sign in right now?</div>
          <Link
            to="/cart"
            className="inline-block text-xs font-semibold text-amber-700 hover:text-amber-800"
          >
            Continue as Guest to Cart & Checkout →
          </Link>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
