import React, { useState } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Store,
  MessageCircle
} from 'lucide-react';

const ContactPage = () => {
  const { outlets, showToast } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/enquiries/contact', {
        name,
        email,
        phone,
        subject,
        message,
      });

      if (res.data?.success) {
        setSubmitted(true);
        showToast('Message sent! Our customer care team will reply promptly.', 'success');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Unable to send message. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>We are here to help</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
          Contact Ammas Pastries
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Have a question about cake flavours, delivery status, or custom wedding tier cakes? Reach out to our bakery team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Contact Info & Outlets list (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-xs space-y-5">
            <h2 className="font-serif font-bold text-lg text-chocolate border-b border-slate-100 pb-3">
              Direct Bakery Care
            </h2>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[11px]">Helpline Phone</div>
                  <div className="font-bold text-chocolate text-sm mt-0.5">+91 80 4567 8900</div>
                  <div className="text-[11px] text-slate-400">Available 10:00 AM - 10:00 PM (All 7 Days)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[11px]">Email Care</div>
                  <a href="mailto:mkumar200418@gmail.com" className="font-bold text-chocolate hover:text-amber-800 text-sm mt-0.5 block transition-colors">
                    mkumar200418@gmail.com
                  </a>
                  <div className="text-[11px] text-slate-400">Responses within 2 hours</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[11px]">Central Kitchen & HQ</div>
                  <div className="font-semibold text-chocolate mt-0.5">
                    Ammas Pastries Central Kitchen, Brigade Plaza, MG Road, Bengaluru, Karnataka 560001
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[11px]">Kitchen Hours</div>
                  <div className="font-bold text-chocolate mt-0.5">10:00 AM to 10:00 PM (All Days)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Outlets Directory Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-chocolate flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" />
              <span>Our Bakery Branches ({outlets.length})</span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
              {outlets.map((o) => (
                <div key={o.id} className="pt-2">
                  <div className="font-bold text-chocolate">{o.name}</div>
                  <div className="text-slate-500 text-[11px]">{o.address}</div>
                  <div className="text-[11px] text-amber-700">📞 {o.phone}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-warm">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-chocolate">Message Received</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Thank you for getting in touch. One of our support executives will email or call you shortly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setPhone('');
                  setSubject('');
                  setMessage('');
                }}
                className="text-xs font-bold text-amber-700 underline pt-2"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-serif font-bold text-xl text-chocolate pb-2 border-b border-slate-100">
                Send Us A Note
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Venkatesh"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya@gmail.com"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Custom 3-Tier Anniversary Cake"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Message *</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we make your celebration even more delightful?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Sending Message...' : 'Submit Message'}</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};

export default ContactPage;
