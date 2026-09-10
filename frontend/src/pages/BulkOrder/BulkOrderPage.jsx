import React, { useState } from 'react';
import api, { API_BASE_URL } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Upload,
  FileSpreadsheet,
  MessageSquare,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

const BulkOrderPage = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'message'

  // Option 1: CSV upload state
  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvResults, setCsvResults] = useState(null);

  // Option 2: Sentence message state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  // Download template
  const handleDownloadTemplate = () => {
    window.location.href = `${API_BASE_URL}/bulk-orders/template`;
    showToast('Downloading Bulk Order CSV Template...', 'info');
  };

  // Upload CSV
  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      showToast('Please choose a completed CSV file to upload.', 'error');
      return;
    }

    setUploadingCsv(true);
    setCsvResults(null);

    const formData = new FormData();
    formData.append('csv_file', csvFile);

    try {
      const res = await api.post('/bulk-orders/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setCsvResults(res.data.data);
        showToast('CSV Uploaded and validated!', 'success');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'CSV upload failed. Please verify your columns.', 'error');
    } finally {
      setUploadingCsv(false);
    }
  };

  // Submit Message
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    setSubmittingMessage(true);

    try {
      const res = await api.post('/bulk-orders/enquiry', {
        name,
        email,
        phone,
        message,
      });

      if (res.data?.success) {
        showToast('Enquiry received! Our corporate catering manager will call you shortly.', 'success');
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      }
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to submit enquiry.', 'error');
    } finally {
      setSubmittingMessage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3.5 py-1 rounded-full">
          <Building2 className="w-3.5 h-3.5" />
          <span>Corporate & Event Catering</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-chocolate">
          Bulk Orders & Special Events
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Planning a company celebration, wedding reception, or bulk gifting campaign? We offer two effortless ways to submit your corporate order.
        </p>

        {/* Tab switch */}
        <div className="inline-flex p-1.5 bg-amber-100/70 rounded-full border border-amber-200 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'csv'
                ? 'bg-chocolate text-white shadow-xs'
                : 'text-chocolate hover:text-amber-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Option 1: CSV Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'message'
                ? 'bg-chocolate text-white shadow-xs'
                : 'text-chocolate hover:text-amber-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Option 2: Message Form</span>
          </button>
        </div>
      </div>

      {/* Option 1: CSV Upload Component */}
      {activeTab === 'csv' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-warm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-chocolate">
                Bulk Order via Spreadsheet
              </h2>
              <p className="text-xs text-slate-500">
                Download our standardized CSV template, add your desired cake items, and upload here.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto shadow-2xs"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
            <span className="font-bold text-chocolate">Template Columns:</span> Customer Name, Phone, Email, Product Name, Quantity, Preferred Date, Preferred Time, Outlet, Special Instructions.
          </div>

          <form onSubmit={handleCsvUpload} className="space-y-4">
            <div className="border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-3xl p-8 text-center bg-cream/40 transition-colors">
              <input
                type="file"
                id="csv_upload_input"
                accept=".csv, text/csv, text/plain"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="csv_upload_input" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-sm text-chocolate">
                  {csvFile ? csvFile.name : 'Click to Browse Completed CSV File'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Accepts .csv files up to 5MB'}
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploadingCsv || !csvFile}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {uploadingCsv ? 'Validating & Uploading...' : 'Upload & Submit Bulk Order'}
            </button>
          </form>

          {/* Validation report feedback */}
          {csvResults && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Successfully processed {csvResults.valid_count} line items!</span>
              </div>

              {csvResults.errors && csvResults.errors.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Row Notices ({csvResults.errors.length}):</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 pl-5 list-disc text-[11px]">
                    {csvResults.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Option 2: Sentence / Message Form */}
      {activeTab === 'message' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-100 shadow-warm space-y-6">
          <div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-chocolate">
              Describe Your Event Requirements
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tell us what you have in mind (e.g., <em>"I need 100 cupcakes and 20 celebration cakes for an event on 25 December"</em>).
            </p>
          </div>

          <form onSubmit={handleMessageSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anand@company.com"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Requirements / Order Note *</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I need 100 assorted cupcakes and 15 kg chocolate truffle cake for our annual celebration on 25 December at our Whitefield office..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submittingMessage}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submittingMessage ? 'Submitting Enquiry...' : 'Submit Bulk Order Enquiry'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default BulkOrderPage;
