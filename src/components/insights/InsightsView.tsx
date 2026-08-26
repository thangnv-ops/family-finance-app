import React, { useState, useMemo } from 'react';
import {
  Transaction,
  Category,
  Budget,
  FinancialAccount,
  SavingsDeposit,
  Loan,
  Member,
} from '../../types/finance';
import {
  generateMonthlyTrend,
  generate6MonthForecast,
  calculateBalances,
  AccountBalances,
} from '../../lib/ledger';
import { formatVND, formatDateVN, formatMonthVN, getCurrentMonthStr } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  PieChart as PieIcon,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface InsightsViewProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: FinancialAccount[];
  savingsDeposits: SavingsDeposit[];
  loans: Loan[];
  members: Member[];
  balances: AccountBalances;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  transactions,
  categories,
  budgets,
  accounts,
  savingsDeposits,
  loans,
  members,
  balances,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentMonthStr());
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // 12-month Trend
  const monthlyTrendData = useMemo(() => {
    return generateMonthlyTrend(transactions, categories, budgets, 12);
  }, [transactions, categories, budgets]);

  // Category Pie Chart data for selected month
  const categoryPieData = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => !t.deletedAt && t.transactionDate.startsWith(selectedPeriod))
      .forEach((t) => {
        if (
          t.categoryId &&
          (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_PURCHASE')
        ) {
          map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
        }
      });

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categoryMap.get(catId);
        return {
          name: cat?.name || 'Khác',
          value: amount,
          color: cat?.color || '#94a3b8',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedPeriod, categoryMap]);

  // Top 10 Expenses for selected month (Section 14)
  const top10Expenses = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          !t.deletedAt &&
          t.transactionDate.startsWith(selectedPeriod) &&
          (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_PURCHASE')
      )
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions, selectedPeriod]);

  // 6-Month Cash Forecast (Section 36)
  const forecastData = useMemo(() => {
    return generate6MonthForecast(balances, budgets, [
      { amount: 59_500_000, type: 'INCOME', isActive: true },
      { amount: 32_000_000, type: 'EXPENSE', isActive: true },
    ]);
  }, [balances, budgets]);

  const totalSelectedExpense = categoryPieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            <span>Báo cáo & Phân tích chuyên sâu</span>
          </h2>
          <p className="text-xs text-slate-500">
            Biểu đồ xu hướng 12 tháng, cơ cấu chi tiêu & dự báo dòng tiền 6 tháng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Tháng:</label>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 1. 12-Month Income vs Expense Chart */}
      <section className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Thu nhập vs Chi tiêu (12 Tháng gần nhất)</span>
        </h3>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(val) => `${(val / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(val: any) => [formatVND(Number(val)), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  color: '#0f172a',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. Expense Category Breakdown (Donut) & Top 10 Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown Donut */}
        <section className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-600" />
              <span>Cơ cấu chi tiêu ({formatMonthVN(selectedPeriod)})</span>
            </h3>
            <span className="text-xs font-bold text-rose-600">
              Tổng: {formatVND(totalSelectedExpense)}
            </span>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
              Chưa có chi tiêu nào trong tháng này.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-48 h-48 sm:w-56 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatVND(Number(val)), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-1.5 max-h-48 overflow-y-auto w-full text-xs pr-1">
                {categoryPieData.map((item, idx) => {
                  const pct = totalSelectedExpense > 0 ? Math.round((item.value / totalSelectedExpense) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{formatVND(item.value)}</span>
                        <span className="text-slate-400 text-[10px] ml-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Top 10 Expenses List (Section 14) */}
        <section className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Top 10 khoản chi lớn nhất ({formatMonthVN(selectedPeriod)})</span>
          </h3>

          {top10Expenses.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
              Chưa có dữ liệu cho tháng này.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {top10Expenses.map((tx, idx) => {
                const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 truncate block">{tx.description}</span>
                        <span className="text-[10px] text-slate-500">
                          {formatDateVN(tx.transactionDate)} &middot; {cat?.name || 'Khác'}
                        </span>
                      </div>
                    </div>

                    <span className="font-extrabold text-rose-600 text-xs sm:text-sm flex-shrink-0">
                      -{formatVND(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* 3. 6-Month Cash Forecast & Buffer Chart (Section 36) */}
      <section className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span>Dự báo dòng tiền & Vị thế khả dụng 6 Tháng tới (Forecast Engine)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Tính toán dựa trên lương dự kiến, các hóa đơn định kỳ, tiền nhà, sổ tiết kiệm và các khoản chi lớn
          </p>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickFormatter={(val) => `${(val / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip
                formatter={(val: any) => [formatVND(Number(val)), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  color: '#0f172a',
                }}
              />
              <Area
                type="monotone"
                dataKey="projectedCash"
                name="Tiền mặt khả dụng tích lũy"
                stroke="#0891b2"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCash)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
