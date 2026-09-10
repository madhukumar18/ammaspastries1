import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  Cake,
  Store,
  FileSpreadsheet,
  Handshake,
  MessageSquare,
  Calendar,
  BarChart3,
  LineChart
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Sales Chart state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/admin/dashboard/summary');
        if (res.data?.data) {
          setSummary(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching admin summary:', err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch Sales Bar Chart & Line Graph data by selected year
  useEffect(() => {
    const fetchChart = async () => {
      setLoadingChart(true);
      try {
        const res = await api.get(`/admin/dashboard/sales-bar-chart?year=${selectedYear}`);
        if (res.data?.data) {
          setChartData(res.data.data.chart_data);
          if (res.data.data.available_years && res.data.data.available_years.length > 0) {
            setAvailableYears(res.data.data.available_years);
          }
        }
      } catch (err) {
        console.warn('Error fetching sales chart:', err);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchChart();
  }, [selectedYear]);

  // Find max sales for chart normalization
  const maxSaleValue = Math.max(...chartData.map((d) => d.sales), 1000);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-chocolate">
            Executive Bakery Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time revenue metrics, order velocity & branch operational tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database Live Synced</span>
          </span>
        </div>
      </div>

      {/* 3 TOP SALES REVENUE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Yearly Sales */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-warm relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Yearly Sales ({new Date().getFullYear()})
          </div>
          <div className="font-serif text-3xl font-bold text-chocolate mt-2">
            ₹{summary ? summary.sales.yearly.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Verified Paid Orders Only</span>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-warm relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Monthly Sales ({new Date().toLocaleString('en-US', { month: 'short' })})
          </div>
          <div className="font-serif text-3xl font-bold text-chocolate mt-2">
            ₹{summary ? summary.sales.monthly.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Current Month Total</span>
          </div>
        </div>

        {/* Daily Sales */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-warm relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Today's Fresh Sales
          </div>
          <div className="font-serif text-3xl font-bold text-chocolate mt-2">
            ₹{summary ? summary.sales.daily.toLocaleString('en-IN') : '...'}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Live Today Counter</span>
          </div>
        </div>

      </div>

      {/* OPERATIONS METRIC PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase">Total Orders</div>
          <div className="text-xl font-bold text-chocolate mt-1">{summary?.counts?.total_orders || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-amber-600 font-bold uppercase">Pending / Baking</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{summary?.counts?.pending_orders || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-emerald-600 font-bold uppercase">Delivered</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{summary?.counts?.completed_orders || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase">Registered Users</div>
          <div className="text-xl font-bold text-chocolate mt-1">{summary?.counts?.customers || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase">Active Cakes</div>
          <div className="text-xl font-bold text-chocolate mt-1">{summary?.counts?.products || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase">Bakery Outlets</div>
          <div className="text-xl font-bold text-chocolate mt-1">{summary?.counts?.outlets || 0}</div>
        </div>
      </div>

      {/* 41. SALES BAR CHART (Database-driven with Year selector) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif font-bold text-lg text-chocolate">
                Monthly Sales Distribution (Bar Chart)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly aggregated from paid/completed orders in MySQL database
            </p>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-600">Select Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-amber-50 border border-amber-300 font-bold text-xs text-chocolate rounded-xl px-3.5 py-1.5 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year: {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Canvas / SVG Bar Chart */}
        {loadingChart ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            Calculating sales from database...
          </div>
        ) : (
          <div className="h-72 flex items-end justify-between gap-2 sm:gap-4 pt-8 px-2 border-b border-slate-200">
            {chartData.map((d) => {
              const heightPercent = Math.max(8, Math.round((d.sales / maxSaleValue) * 100));
              return (
                <div key={d.month_num} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-chocolate text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap pointer-events-none z-20 shadow-md">
                    <div className="font-bold">₹{d.sales.toLocaleString('en-IN')}</div>
                    <div>{d.order_count} Orders</div>
                  </div>

                  {/* The Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[36px] bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-lg group-hover:from-amber-600 group-hover:to-amber-400 transition-all shadow-2xs"
                  />

                  {/* Month label */}
                  <span className="text-[11px] font-bold text-slate-500 mt-2">
                    {d.month_name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 42. SALES LINE GRAPH (Visual Monthly Growth Curve) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-100 shadow-warm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-amber-600" />
              <h2 className="font-serif font-bold text-lg text-chocolate">
                Monthly Sales Trend (Line Graph)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous trend view for Year {selectedYear}
            </p>
          </div>
        </div>

        {/* SVG Curve rendering real values */}
        <div className="w-full h-56 pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1200 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="50" x2="1200" y2="50" stroke="#F1F5F9" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="1200" y2="100" stroke="#F1F5F9" strokeDasharray="4 4" />
            <line x1="0" y1="150" x2="1200" y2="150" stroke="#F1F5F9" strokeDasharray="4 4" />

            {/* Polyline */}
            {chartData.length > 0 && (
              <polyline
                fill="none"
                stroke="#D97706"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartData
                  .map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 1200;
                    const y = 180 - (d.sales / maxSaleValue) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}

            {/* Nodes */}
            {chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 1200;
              const y = 180 - (d.sales / maxSaleValue) * 160;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="6"
                  className="fill-amber-600 stroke-white stroke-2 hover:r-8 transition-all"
                />
              );
            })}
          </svg>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;
