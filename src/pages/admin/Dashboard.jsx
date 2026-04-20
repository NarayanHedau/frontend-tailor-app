import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  PlusIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { orderAPI } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [deadlines, setDeadlines] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartGroupMode, setChartGroupMode] = useState('monthly');
  const [chartLoading, setChartLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Date range for chart filter
  const today = new Date().toISOString().split('T')[0];
  const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split('T')[0];
  const [chartStartDate, setChartStartDate] = useState(defaultStart);
  const [chartEndDate, setChartEndDate] = useState(today);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, deadlinesRes, chartRes] = await Promise.all([
        orderAPI.getStats(),
        orderAPI.getDeadlines(),
        orderAPI.getChartData({ startDate: chartStartDate, endDate: chartEndDate }),
      ]);
      setStats(statsRes.data.data);
      setDeadlines(deadlinesRes.data.data);
      setChartData(chartRes.data.data);
      setChartGroupMode(chartRes.data.groupMode);
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (startDate, endDate) => {
    setChartLoading(true);
    try {
      const { data } = await orderAPI.getChartData({ startDate, endDate });
      setChartData(data.data);
      setChartGroupMode(data.groupMode);
    } catch {
      toast.error('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  };

  const handleApplyFilter = () => {
    if (!chartStartDate || !chartEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (new Date(chartStartDate) > new Date(chartEndDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    fetchChartData(chartStartDate, chartEndDate);
  };

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const s = start.toISOString().split('T')[0];
    const e = end.toISOString().split('T')[0];
    setChartStartDate(s);
    setChartEndDate(e);
    fetchChartData(s, e);
  };

  const revenueFormatter = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(value);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Welcome back!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Here's what's happening today.</p>
        </div>
        <Link to="/admin/orders/new" className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={stats?.orders?.total ?? 0}
          icon={ClipboardDocumentListIcon}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={stats?.orders?.pending ?? 0}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          label="In Progress"
          value={stats?.orders?.inProgress ?? 0}
          icon={WrenchScrewdriverIcon}
          color="purple"
        />
        <StatCard
          label="Completed"
          value={stats?.orders?.completed ?? 0}
          icon={CheckCircleIcon}
          color="green"
        />
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats?.revenue?.totalRevenue ?? 0)}
          icon={CurrencyRupeeIcon}
          color="blue"
        />
        <StatCard
          label="Collected"
          value={formatCurrency(stats?.revenue?.totalCollected ?? 0)}
          icon={CurrencyRupeeIcon}
          color="green"
          sub="Advance payments received"
        />
        <StatCard
          label="Pending Collection"
          value={formatCurrency(stats?.revenue?.totalPending ?? 0)}
          icon={CurrencyRupeeIcon}
          color="red"
          sub="Outstanding balance"
        />
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {/* Chart Filter Bar */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <h3 className="font-semibold text-gray-800 dark:text-white whitespace-nowrap">Analytics</h3>

            {/* Quick Range Buttons */}
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

            {/* Custom Date Range */}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                className="input text-xs py-1.5 w-[130px]"
                value={chartStartDate}
                onChange={(e) => setChartStartDate(e.target.value)}
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                className="input text-xs py-1.5 w-[130px]"
                value={chartEndDate}
                max={today}
                onChange={(e) => setChartEndDate(e.target.value)}
              />
              <button
                onClick={handleApplyFilter}
                disabled={chartLoading}
                className="btn-primary text-xs px-3 py-1.5"
              >
                {chartLoading ? 'Loading...' : 'Apply'}
              </button>
            </div>
          </div>

          {/* Active range indicator */}
          <p className="text-xs text-gray-400 mt-2">
            Showing: {formatDate(chartStartDate)} — {formatDate(chartEndDate)}
            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
              {chartGroupMode === 'daily' ? 'Daily' : chartGroupMode === 'monthly' ? 'Monthly' : 'Yearly'} view
            </span>
          </p>
        </div>

        {chartLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5 flex items-center justify-center h-[360px]">
              <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <div className="card p-5 flex items-center justify-center h-[360px]">
              <div className="w-7 h-7 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Orders Chart — Gradient Bar */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Orders Overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {chartData.reduce((s, d) => s + d.totalOrders, 0)} total orders
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { color: '#10b981', label: 'Completed' },
                    { color: '#f59e0b', label: 'Pending' },
                    { color: '#ef4444', label: 'Cancelled' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={chartData} margin={{ top: 0, right: 5, left: -15, bottom: 0 }} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="gradCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
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
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '10px',
                      color: '#f9fafb',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                      padding: '10px 14px',
                    }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullLabel || label}
                    labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="url(#gradCompleted)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="url(#gradPending)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cancelled" name="Cancelled" fill="url(#gradCancelled)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Trend — Area Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Revenue Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatCurrency(chartData.reduce((s, d) => s + d.revenue, 0))} total
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart data={chartData} margin={{ top: 0, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
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
                    formatter={(value) => [formatCurrency(value)]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullLabel || label}
                    labelStyle={{ color: '#9ca3af', marginBottom: '4px', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Total Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#gradRevenue)"
                    dot={chartGroupMode !== 'daily' ? { r: 4, fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 2 } : false}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Payment Collection — Pie Chart */}
        {(() => {
          const totalReceived = chartData.reduce((s, d) => s + d.collected, 0);
          const totalRemaining = chartData.reduce((s, d) => s + d.pendingAmount, 0);
          const totalRevenue = totalReceived + totalRemaining;
          if (totalRevenue === 0) return null;

          const pieData = [
            { name: 'Received', value: totalReceived },
            { name: 'Remaining', value: totalRemaining },
          ];
          const PIE_COLORS = ['#10b981', '#f87171'];
          const receivedPct = Math.round((totalReceived / totalRevenue) * 100);

          return (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Payment Collection</h3>
              <p className="text-xs text-gray-400 mb-4">Received vs remaining from customers</p>

              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Pie */}
                <div className="relative">
                  <ResponsiveContainer width={220} height={220}>
                    <PieChart>
                      <defs>
                        <linearGradient id="pieGradReceived" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="pieGradRemaining" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fca5a5" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                        cornerRadius={6}
                      >
                        <Cell fill="url(#pieGradReceived)" />
                        <Cell fill="url(#pieGradRemaining)" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid #374151',
                          borderRadius: '10px',
                          color: '#f9fafb',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                          padding: '8px 12px',
                        }}
                        formatter={(value) => [formatCurrency(value)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{receivedPct}%</span>
                    <span className="text-[10px] text-gray-400">collected</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="flex-1 space-y-4 w-full">
                  {/* Total */}
                  <div className="text-center md:text-left">
                    <p className="text-xs text-gray-400">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(totalRevenue)}</p>
                  </div>

                  {/* Received */}
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Received</span>
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceived)}</span>
                    </div>
                    <div className="mt-2 w-full bg-green-200 dark:bg-green-900/30 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${receivedPct}%` }} />
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Remaining</span>
                      </div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totalRemaining)}</span>
                    </div>
                    <div className="mt-2 w-full bg-red-200 dark:bg-red-900/30 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${100 - receivedPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Overdue & Upcoming Alerts */}
      {deadlines && (deadlines.overdue?.length > 0 || deadlines.upcomingDeliveries?.length > 0 || deadlines.upcomingTrials?.length > 0) && (
        <div className="space-y-3">
          {deadlines.overdue?.length > 0 && (
            <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-red-700 dark:text-red-400">
                    Overdue Orders ({deadlines.overdue.length})
                  </h3>
                </div>
                <Link to="/admin/calendar" className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                  View all <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {deadlines.overdue.slice(0, 3).map((order) => (
                  <Link
                    key={order._id}
                    to={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 hover:shadow-sm transition-shadow"
                  >
                    <div>
                      <span className="font-mono text-sm text-red-600 font-medium">{order.order_number}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">{order.customer_id?.name}</span>
                    </div>
                    <span className="text-xs text-red-500 font-medium">Due: {formatDate(order.delivery_date)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(deadlines.upcomingTrials?.length > 0 || deadlines.upcomingDeliveries?.length > 0) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Upcoming Deadlines</h3>
                </div>
                <Link to="/admin/calendar" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Calendar <ArrowRightIcon className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {deadlines.upcomingTrials?.slice(0, 2).map((order) => (
                  <Link
                    key={order._id}
                    to={`/admin/orders/${order._id}`}
                    className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg px-3 py-2 hover:shadow-sm transition-shadow"
                  >
                    <ClockIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        Trial: {order.customer_id?.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(order.trial_date)}</p>
                    </div>
                  </Link>
                ))}
                {deadlines.upcomingDeliveries?.slice(0, 2).map((order) => (
                  <Link
                    key={order._id}
                    to={`/admin/orders/${order._id}`}
                    className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg px-3 py-2 hover:shadow-sm transition-shadow"
                  >
                    <CalendarDaysIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        Delivery: {order.customer_id?.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(order.delivery_date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Recent Orders</h3>
          <Link
            to="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-6 py-3 text-gray-500 font-medium">Order #</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Customer</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Date</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(stats?.recentOrders ?? []).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-3 font-mono text-blue-600 font-medium">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">
                      {order.customer_id?.name}
                    </div>
                    <div className="text-gray-400 text-xs">{order.customer_id?.phone}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(order.order_date)}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(stats?.recentOrders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No orders yet. <Link to="/admin/orders/new" className="text-blue-600">Create your first order</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
