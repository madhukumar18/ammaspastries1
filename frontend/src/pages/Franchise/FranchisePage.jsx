import React, { useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Store, Handshake, CheckCircle2, Award, TrendingUp, Sparkles } from 'lucide-react';

const FranchisePage = () => {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('20 - 35 Lakhs');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/enquiries/franchise', {
        name,
        email,
        phone,
        city,
        investment_budget: budget,
        message,
      });

      if (res.data?.success) {
        setSubmitted(true);
        showToast('Franchise enquiry submitted successfully!', 'success');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Unable to submit enquiry. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full">
          <Handshake className="w-3.5 h-3.5" />
          <span>Business Partnership</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
          Franchise Enquiry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Write us a message and submit enquiry to join Karnataka’s fastest growing bakery network.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
          <div className="text-2xl font-serif font-bold text-amber-800">15+</div>
          <div className="text-xs font-semibold text-chocolate">Thriving Outlets</div>
          <div className="text-[11px] text-slate-400">Across Prime Bengaluru Locations</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
          <div className="text-2xl font-serif font-bold text-emerald-800">40%+</div>
          <div className="text-xs font-semibold text-chocolate">High Gross Margins</div>
          <div className="text-[11px] text-slate-400">Central Kitchen Supply Model</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
          <div className="text-2xl font-serif font-bold text-amber-800">360°</div>
          <div className="text-xs font-semibold text-chocolate">Full Franchise Support</div>
          <div className="text-[11px] text-slate-400">Branding, Training, POS & Operations</div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-warm max-w-2xl mx-auto">
        {submitted ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-chocolate">
              Enquiry Received!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Thank you for choosing Ammas Pastries. Our business development team will review your proposal and contact you within 24 hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setName('');
                setEmail('');
                setPhone('');
                setMessage('');
              }}
              className="text-xs font-bold text-amber-700 underline pt-2"
            >
              Submit Another Enquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. suresh@gmail.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target City / Locality *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mysore / HSR Layout"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Investment Budget</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 font-semibold text-chocolate focus:outline-none focus:border-amber-500"
                >
                  <option value="15 - 25 Lakhs">₹15 - ₹25 Lakhs (Kiosk Model)</option>
                  <option value="25 - 40 Lakhs">₹25 - ₹40 Lakhs (Standard Cafe Model)</option>
                  <option value="40 Lakhs+">₹40 Lakhs+ (Master Franchise / Flagship)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your business background, commercial property availability, and timeline..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              {submitting ? 'Submitting Enquiry...' : 'Submit Franchise Enquiry'}
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

export default FranchisePage;
