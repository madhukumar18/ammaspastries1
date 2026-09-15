import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminBulkProductsPage = () => {
  const { showToast } = useApp();

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const fileInputRef = useRef(null);

  // Export full catalog
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const res = await api.get('/admin/products/export-csv', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ammas_Pastries_Products_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('All website products exported to CSV successfully!', 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('Failed to export products to CSV.', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/admin/products/csv-template', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Ammas_Pastries_Products_Bulk_Template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Sample template downloaded.', 'success');
    } catch (err) {
      console.error('Template download failed:', err);
      showToast('Failed to download template.', 'error');
    }
  };

  // CSV File select & preview
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      showToast('Please select a valid .csv file.', 'error');
      return;
    }

    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');
      if (lines.length > 0) {
        const preview = lines.slice(0, 6).map((l) => {
          return l.split(',').map((item) => item.replace(/^"|"$/g, '').trim());
        });
        setCsvPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Upload
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Please select a CSV file first.', 'error');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formDataObj = new FormData();
      formDataObj.append('file', importFile);

      const res = await api.post('/admin/products/bulk-upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setImportResult(res.data.data);
        showToast(res.data.message || 'Bulk product update completed!', 'success');
      } else {
        showToast(res.data?.message || 'Bulk upload failed.', 'error');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Bulk upload failed.';
      showToast(errMsg, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Catalog Spreadsheet Manager</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Bulk Products Import & Excel Updater
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Export all live products across the entire website to an Excel/CSV spreadsheet, edit any detail, or add new products in bulk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <span>View Products Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Action Cards: Step 1 (Download) & Step 2 (Upload) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Export Live Catalog or Download Blank Template */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-chocolate">
                Step 1: Download or Export CSV
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Download the complete current product inventory to modify prices, weights, eggless flags and variants in Excel, or download a blank sample template to add new items.
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl space-y-2 text-xs text-emerald-950">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ready for Excel & Google Sheets</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Includes UTF-8 BOM encoding so special characters, prices, and line breaks open cleanly in Microsoft Excel without formatting issues.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all"
            >
              {exportingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Export Full Current Catalog (.csv)</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>Download Sample Template (.csv)</span>
            </button>
          </div>
        </div>

        {/* Step 2: Upload Completed CSV */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-chocolate">
                Step 2: Upload Modified Spreadsheet
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload your modified CSV. Products with matching <code>ID</code>, <code>SKU</code>, or <code>Slug</code> will be automatically updated. New products without an ID will be created.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                importFile
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <FileUp className={`w-8 h-8 ${importFile ? 'text-emerald-600' : 'text-amber-600'}`} />
                {importFile ? (
                  <div>
                    <p className="font-bold text-xs text-emerald-900">{importFile.name}</p>
                    <p className="text-[10px] text-slate-500">{(importFile.size / 1024).toFixed(1)} KB — Click to choose different file</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-xs text-slate-700">Choose or Drag & Drop your .csv file</p>
                    <p className="text-[10px] text-slate-400">Click to browse your computer</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleBulkUpload}
            disabled={!importFile || importing}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Spreadsheet...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Apply Bulk Changes to Website</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* CSV Quick Preview Table */}
      {csvPreviewRows.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-chocolate flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Spreadsheet Preview (First {csvPreviewRows.length - 1} rows)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {csvPreviewRows[0]?.length || 0} Columns Detected
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-56">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  {csvPreviewRows[0]?.map((col, idx) => (
                    <th key={idx} className="p-2.5 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                {csvPreviewRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-amber-50/30 transition-colors">
                    {row.map((val, cIdx) => (
                      <td key={cIdx} className="p-2.5 whitespace-nowrap text-slate-700 max-w-[150px] truncate">
                        {val || <span className="text-slate-300 italic">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Results Banner */}
      {importResult && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-serif font-bold text-base text-chocolate">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Upload Results & Summary</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{importResult.created_count}</div>
              <div className="text-xs font-semibold uppercase mt-0.5 text-emerald-700">New Products Added</div>
            </div>
            <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{importResult.updated_count}</div>
              <div className="text-xs font-semibold uppercase mt-0.5 text-blue-700">Products Updated</div>
            </div>
            <div className={`rounded-2xl p-4 text-center border ${
              importResult.failed_count > 0 ? 'bg-rose-50 text-rose-900 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <div className="text-2xl font-bold">{importResult.failed_count}</div>
              <div className="text-xs font-semibold uppercase mt-0.5">Failed / Skipped</div>
            </div>
          </div>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Validation Notices ({importResult.errors.length}):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto pl-1 text-[11px]">
                {importResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Field Formatting Reference Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-600" />
          <h3 className="font-serif font-bold text-base text-chocolate">
            Spreadsheet Column Reference & Guidelines
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Column Name</th>
                <th className="p-3">Required?</th>
                <th className="p-3">Example Value</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">ID</td>
                <td className="p-3 text-slate-400">Optional</td>
                <td className="p-3 font-mono">25</td>
                <td className="p-3">Database ID. Keep to <strong>update</strong> existing product; leave blank to create a new one.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">SKU</td>
                <td className="p-3 text-slate-400">Optional</td>
                <td className="p-3 font-mono">AMP-TRF-01</td>
                <td className="p-3">Product SKU. Auto-generated if left empty.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Name</td>
                <td className="p-3 font-bold text-rose-600">Required</td>
                <td className="p-3">Belgian Chocolate Truffle</td>
                <td className="p-3">Full product display name.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Category</td>
                <td className="p-3 font-bold text-rose-600">Required</td>
                <td className="p-3">Theme Cakes, Cakes & Pastries</td>
                <td className="p-3">Matches category name or slug.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Subcategory</td>
                <td className="p-3 text-slate-400">Optional</td>
                <td className="p-3">Exotic Fruitz, Premium Cakes</td>
                <td className="p-3">Leave empty for Theme Cakes or categories without subcategories.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Base Price</td>
                <td className="p-3 font-bold text-rose-600">Required</td>
                <td className="p-3 font-mono">599</td>
                <td className="p-3">Regular selling price in ₹.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Discount Price</td>
                <td className="p-3 text-slate-400">Optional</td>
                <td className="p-3 font-mono">549</td>
                <td className="p-3">Discounted special offer price in ₹.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Is Eggless</td>
                <td className="p-3 text-slate-400">Optional</td>
                <td className="p-3 font-mono">yes / no</td>
                <td className="p-3">Accepts <code>yes</code>, <code>no</code>, <code>true</code>, <code>false</code>, <code>1</code>, <code>0</code>.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-bold text-chocolate">Variants</td>
                <td className="p-3 text-slate-400">Optional</td>
                <td className="p-3 font-mono text-[10px]">500g:499:450|1kg:899:849</td>
                <td className="p-3">Pipe-separated variants formatted as <code>Size:Price:DiscountPrice</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBulkProductsPage;
