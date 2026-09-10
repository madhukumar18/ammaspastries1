import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Mail, Phone, MapPin, IndianRupee, Briefcase, CheckCircle2, Circle, Trash2, MessageSquare } from 'lucide-react';

const AdminEnquiriesPage = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('franchise'); // 'franchise' or 'contact'

  const [franchiseList, setFranchiseList] = useState([]);
  const [contactList, setContactList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([
        api.get('/admin/franchise-enquiries'),
        api.get('/admin/contact-enquiries'),
      ]);
      if (fRes.data?.data) setFranchiseList(fRes.data.data);
      if (cRes.data?.data) setContactList(cRes.data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const toggleFranchiseRead = async (id) => {
    try {
      const res = await api.post(`/admin/franchise-enquiries/${id}/toggle-read`);
      showToast(res.data?.message || 'Updated', 'success');
      setFranchiseList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: !item.is_read } : item))
      );
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const deleteFranchise = async (id) => {
    if (!window.confirm('Delete this franchise application?')) return;
    try {
      await api.delete(`/admin/franchise-enquiries/${id}`);
      showToast('Deleted', 'success');
      setFranchiseList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const toggleContactRead = async (id) => {
    try {
      const res = await api.post(`/admin/contact-enquiries/${id}/toggle-read`);
      showToast(res.data?.message || 'Updated', 'success');
      setContactList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: !item.is_read } : item))
      );
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Delete this contact message?')) return;
    try {
      await api.delete(`/admin/contact-enquiries/${id}`);
      showToast('Deleted', 'success');
      setContactList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const unreadFranchiseCount = franchiseList.filter((f) => !f.is_read).length;
  const unreadContactCount = contactList.filter((c) => !c.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Inbound Enquiries</h1>
          <p className="text-sm text-gray-500">
            Review partner franchise applications and direct customer care messages.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-cream-100 p-1.5 rounded-2xl border border-cream-200 self-start">
          <button
            onClick={() => setActiveTab('franchise')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'franchise'
                ? 'bg-white text-bakery-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Franchise Applications
            {unreadFranchiseCount > 0 && (
              <span className="bg-bakery-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadFranchiseCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'contact'
                ? 'bg-white text-bakery-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Contact Messages
            {unreadContactCount > 0 && (
              <span className="bg-bakery-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadContactCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading enquiries...</div>
      ) : activeTab === 'franchise' ? (
        /* FRANCHISE TAB */
        franchiseList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-cream-200 text-gray-500">
            No franchise applications received yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {franchiseList.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                  !item.is_read ? 'border-bakery-300 ring-2 ring-bakery-100' : 'border-cream-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{item.full_name}</h3>
                        {!item.is_read && (
                          <span className="bg-bakery-100 text-bakery-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted on {new Date(item.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFranchiseRead(item.id)}
                        className={`p-1.5 rounded-xl text-xs transition-colors ${
                          item.is_read ? 'text-gray-400 hover:text-gray-600' : 'text-bakery-600 hover:bg-bakery-50'
                        }`}
                        title={item.is_read ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        {item.is_read ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteFranchise(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-cream-50/70 p-3 rounded-2xl mb-3">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-bakery-500" />
                      <span>{item.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-bakery-500" />
                      <span className="truncate">{item.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-bakery-500" />
                      <span>{item.city}, {item.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-bakery-500" />
                      <span>Budget: {item.investment_budget}</span>
                    </div>
                  </div>

                  {item.experience && (
                    <div className="text-xs text-gray-600 mb-2">
                      <span className="font-semibold text-gray-800">Background:</span> {item.experience}
                    </div>
                  )}

                  {item.message && (
                    <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      "{item.message}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* CONTACT US TAB */
        contactList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-cream-200 text-gray-500">
            No customer contact messages received yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {contactList.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                  !item.is_read ? 'border-bakery-300 ring-2 ring-bakery-100' : 'border-cream-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                        {!item.is_read && (
                          <span className="bg-bakery-100 text-bakery-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleContactRead(item.id)}
                        className={`p-1.5 rounded-xl text-xs transition-colors ${
                          item.is_read ? 'text-gray-400 hover:text-gray-600' : 'text-bakery-600 hover:bg-bakery-50'
                        }`}
                        title={item.is_read ? 'Mark as Unread' : 'Mark as Read'}
                      >
                        {item.is_read ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteContact(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-bakery-500" />
                      <span>{item.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-bakery-500" />
                      <span>{item.email}</span>
                    </div>
                    {item.subject && (
                      <div className="font-semibold text-gray-800 pt-1">
                        Subject: {item.subject}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-700 bg-cream-50 p-3 rounded-2xl leading-relaxed border border-cream-200">
                    "{item.message}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default AdminEnquiriesPage;
