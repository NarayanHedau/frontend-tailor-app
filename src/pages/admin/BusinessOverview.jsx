import { useState, useEffect } from 'react';
import { purchaseAPI, saleAPI, productAPI } from '../../services/api';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function BusinessOverview() {
  const [purchaseStats, setPurchaseStats] = useState(null);
  const [saleStats, setSaleStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartGroupMode, setChartGroupMode] = useState('monthly');
  const [chartLoading, setChartLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Date filter
  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const today = toLocalYMD(new Date());
  const defaultStart = toLocalYMD(new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1));
  const [chartStartDate, setChartStartDate] = useState(defaultStart);
  const [chartEndDate, setChartEndDate] = useState(today);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [purRes, salRes, prodRes, chartRes] = await Promise.all([
        purchaseAPI.getStats(),
        saleAPI.getStats(),
        productAPI.getAll({ lowStock: 'true', limit: 50 }),
        purchaseAPI.getBusinessChart({ startDate: chartStartDate, endDate: chartEndDate }),
      ]);
      setPurchaseStats(purRes.data.data);
      setSaleStats(salRes.data.data);
      setLowStockProducts(prodRes.data.data);
      setChartData(chartRes.data.data);
      setChartGroupMode(chartRes.data.groupMode);
    } catch { toast.error('Failed to load business data'); }
    finally { setLoading(false); }
  };

  const fetchChartData = async (startDate, endDate) => {
    setChartLoading(true);
    try {
      const { data } = await purchaseAPI.getBusinessChart({ startDate, endDate });
      setChartData(data.data);
      setChartGroupMode(data.groupMode);
    } catch { toast.error('Failed to load chart'); }
    finally { setChartLoading(false); }
  };

  const handleApplyFilter = () => {
    if (!chartStartDate || !chartEndDate) { toast.error('Select both dates'); return; }
    if (new Date(chartStartDate) > new Date(chartEndDate)) { toast.error('Start date must be before end date'); return; }
    fetchChartData(chartStartDate, chartEndDate);
  };

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const s = toLocalYMD(start);
    const e = toLocalYMD(end);
    setChartStartDate(s);
    setChartEndDate(e);
    fetchChartData(s, e);
  };

  const revenueFormatter = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(value);

  if (loading) return <LoadingSpinner />;

  const totalSpent = purchaseStats?.totalSpent || 0;
  const totalSaleRevenue = saleStats?.totalRevenue || 0;
  const profit = totalSaleRevenue - totalSpent;
  const totalPayable = purchaseStats?.totalDue || 0;
  const totalReceivable = saleStats?.totalDue || 0;

  const expensePie = [
    { name: 'Paid to Suppliers', value: purchaseStats?.totalPaid || 0 },
    { name: 'Payable (Due)', value: totalPayable },
  ];
  const incomePie = [
    { name: 'Received from Customers', value: saleStats?.totalReceived || 0 },
    { name: 'Receivable (Due)', value: totalReceivable },
  ];
  const EXPENSE_COLORS = ['#f59e0b', '#ef4444'];
  const INCOME_COLORS = ['#10b981', '#6366f1'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Business Overview</h2>
        <p className="text-sm text-gray-500">Track your expenses, income, and profit</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><ArrowTrendingDownIcon className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalSpent)}</p>
              <p className="text-[10px] text-gray-400">{purchaseStats?.totalPurchases || 0} purchases</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><ArrowTrendingUpIcon className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Sale Revenue</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalSaleRevenue)}</p>
              <p className="text-[10px] text-gray-400">{saleStats?.totalSales || 0} sales</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {profit >= 0 ? <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" /> : <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />}
            </div>
            <div>
              <p className="text-xs text-gray-500">Profit / Loss</p>
              <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(profit))}</p>
              <p className="text-[10px] text-gray-400">{profit >= 0 ? 'Profit' : 'Loss'}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><CubeIcon className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Stock Value</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
              <p className="text-[10px] text-gray-400">{lowStockProducts.length} low stock items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart with Date Filter */}
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-white whitespace-nowrap">Spent vs Received vs Profit</h3>

            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: '7D', days: 7 },
                { label: '30D', days: 30 },
                { label: '90D', days: 90 },
                { label: '6M', days: 180 },
                { label: '1Y', days: 365 },
                { label: '3Y', days: 1095 },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => applyQuickRange(q.days)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <input type="date" className="input text-xs py-1.5 w-[130px]" value={chartStartDate} onChange={(e) => setChartStartDate(e.target.value)} />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" className="input text-xs py-1.5 w-[130px]" value={chartEndDate} max={today} onChange={(e) => setChartEndDate(e.target.value)} />
              <button onClick={handleApplyFilter} disabled={chartLoading} className="btn-primary text-xs px-3 py-1.5">
                {chartLoading ? 'Loading...' : 'Apply'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Showing: {formatDate(chartStartDate)} — {formatDate(chartEndDate)}
            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
              {chartGroupMode === 'daily' ? 'Daily' : chartGroupMode === 'monthly' ? 'Monthly' : 'Yearly'} view
            </span>
          </p>
        </div>

        {/* Area Chart */}
        {chartLoading ? (
          <div className="card p-5 flex items-center justify-center h-[380px]">
            <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4 justify-end">
              {[
                { color: '#ef4444', label: 'Spent' },
                { color: '#10b981', label: 'Received' },
                { color: '#6366f1', label: 'Profit/Loss' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{l.label}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="bizGradSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="bizGradReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="bizGradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval={chartGroupMode === 'daily' ? Math.max(0, Math.floor(chartData.length / 12)) : 0}
                />
                <YAxis
                  tickFormatter={revenueFormatter}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    color: '#f9fafb',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    padding: '10px 14px',
                  }}
                  formatter={(value, name) => [formatCurrency(value), name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullLabel || payload?.[0]?.payload?.label || label}
                  labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  name="Spent"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#bizGradSpent)"
                  dot={chartGroupMode !== 'daily' ? { r: 4, fill: '#ef4444', stroke: '#7f1d1d', strokeWidth: 2 } : false}
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  name="Received"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#bizGradReceived)"
                  dot={chartGroupMode !== 'daily' ? { r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 } : false}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit/Loss"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#bizGradProfit)"
                  dot={chartGroupMode !== 'daily' ? { r: 3, fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Payable vs Receivable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5 border-red-200 dark:border-red-800/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-white">Payable (to Suppliers)</h3>
            <span className="text-lg font-bold text-red-600">{formatCurrency(totalPayable)}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Amount you owe to suppliers</p>
          <div className="flex items-center gap-4">
            <div className="relative w-[140px] h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensePie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0} cornerRadius={4}>
                    {expensePie.map((_, i) => <Cell key={i} fill={EXPENSE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Paid</span></div>
                <span className="text-sm font-bold text-amber-600">{formatCurrency(purchaseStats?.totalPaid || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Due</span></div>
                <span className="text-sm font-bold text-red-600">{formatCurrency(totalPayable)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 border-green-200 dark:border-green-800/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-white">Receivable (from Customers)</h3>
            <span className="text-lg font-bold text-green-600">{formatCurrency(totalReceivable)}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Amount customers owe you</p>
          <div className="flex items-center gap-4">
            <div className="relative w-[140px] h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incomePie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0} cornerRadius={4}>
                    {incomePie.map((_, i) => <Cell key={i} fill={INCOME_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Received</span></div>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(saleStats?.totalReceived || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Due</span></div>
                <span className="text-sm font-bold text-indigo-600">{formatCurrency(totalReceivable)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">Low Stock Alert ({lowStockProducts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  <th className="px-5 py-3 text-gray-500 font-medium">Product</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Category</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Current Stock</th>
                  <th className="px-5 py-3 text-gray-500 font-medium">Alert Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lowStockProducts.map((p) => (
                  <tr key={p._id}>
                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500">{p.category}</td>
                    <td className="px-5 py-3 text-red-600 font-bold">{p.stock_quantity} {p.unit}</td>
                    <td className="px-5 py-3 text-gray-400">{p.low_stock_alert} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
