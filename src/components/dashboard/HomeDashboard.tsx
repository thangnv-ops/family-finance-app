import React, { useMemo } from 'react';
import {
  Transaction,
  FinancialAccount,
  Member,
  Category,
  Budget,
  SavingsDeposit,
  Loan,
  Fund,
  PlannedExpense,
  CreditCardConfig,
  CreditCardStatement,
  RecurringTransaction,
} from '../../types/finance';
import {
  AccountBalances,
  MonthlyStats,
  DailyAdvisorData,
} from '../../lib/ledger';
import { formatVND, formatDateVN, formatMonthVN, getCurrentMonthStr } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Clock,
  ShieldAlert,
  Plus,
  Compass,
  DollarSign,
  Layers,
  HeartHandshake,
} from 'lucide-react';

interface HomeDashboardProps {
  householdName: string;
  currentMemberId: string;
  members: Member[];
  balances: AccountBalances;
  monthlyStats: MonthlyStats;
  dailyAdvisor: DailyAdvisorData;
  recentTransactions: Transaction[];
  categories: Category[];
  creditCardConfig: CreditCardConfig;
  creditCardStatements: CreditCardStatement[];
  savingsDeposits: SavingsDeposit[];
  loans: Loan[];
  funds: Fund[];
  plannedExpenses: PlannedExpense[];
  recurringTransactions: RecurringTransaction[];
  onOpenQuickAdd: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateToTab: (tab: 'transactions' | 'plan' | 'insights' | 'more') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  householdName,
  currentMemberId,
  members,
  balances,
  monthlyStats,
  dailyAdvisor,
  recentTransactions,
  categories,
  creditCardConfig,
  creditCardStatements,
  savingsDeposits,
  loans,
  funds,
  plannedExpenses,
  recurringTransactions,
  onOpenQuickAdd,
  onSelectTransaction,
  onNavigateToTab,
}) => {
  const categoryMap = useMemo(() => new Map<string, Category>(categories.map((c) => [c.id, c])), [categories]);
  const currentYM = getCurrentMonthStr();

  // Upcoming alerts
  const maturingSavings = savingsDeposits.filter((s) => s.status === 'ACTIVE');
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'PARTIALLY_PAID');
  const pendingPlanned = plannedExpenses.filter((p) => p.status === 'READY' || p.status === 'PLANNED');

  const memberFilterName =
    currentMemberId === 'all'
      ? 'Toàn gia đình'
      : members.find((m) => m.id === currentMemberId)?.name || 'Gia đình';

  return (
    <div className="space-y-5 pb-20">
      {/* 1. Daily Spending Advisor Banner (Section 12 & 33.4) */}
      <section className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 border border-indigo-100 rounded-3xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                Cố vấn chi tiêu hàng ngày &middot; {formatMonthVN(currentYM)}
              </span>
              <p className="text-xs text-slate-500">Dành cho {memberFilterName}</p>
            </div>
          </div>

          <span
            className={`self-start sm:self-auto text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
              dailyAdvisor.status === 'SAFE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                : dailyAdvisor.status === 'WARNING'
                ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                : 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'
            }`}
          >
            {dailyAdvisor.status === 'SAFE' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {dailyAdvisor.status === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5" />}
            {dailyAdvisor.status === 'DANGER' && <ShieldAlert className="w-3.5 h-3.5" />}
            <span>
              {dailyAdvisor.status === 'SAFE'
                ? 'Tiến độ an toàn'
                : dailyAdvisor.status === 'WARNING'
                ? 'Cảnh báo vượt nhẹ'
                : 'Nguy cơ vượt ngân sách'}
            </span>
          </span>
        </div>

        {/* Advisor Main Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
          {/* Recommended Today */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">
              Hôm nay nên giữ khoảng
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">
              {formatVND(dailyAdvisor.recommendedToday)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Còn {dailyAdvisor.remainingDays} ngày trong tháng
            </span>
          </div>

          {/* 7-day Pace */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">
              Nhịp chi 7 ngày qua
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              {formatVND(dailyAdvisor.pace7Days)}
              <span className="text-xs text-slate-500 font-normal"> /ngày</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              14 ngày: {formatVND(dailyAdvisor.pace14Days)}/ngày
            </span>
          </div>

          {/* Projected Month End */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block mb-1">
              Dự báo hết tháng
            </span>
            <div
              className={`text-xl sm:text-2xl font-black ${
                dailyAdvisor.projectedVariance > 0 ? 'text-rose-600' : 'text-indigo-600'
              }`}
            >
              {formatVND(dailyAdvisor.projectedMonthEnd)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {dailyAdvisor.projectedVariance > 0
                ? `⚠ Dự kiến vượt ~${formatVND(dailyAdvisor.projectedVariance, { compact: true })}`
                : `Dưới ngân sách ~${formatVND(Math.abs(dailyAdvisor.projectedVariance), { compact: true })}`}
            </span>
          </div>
        </div>

        {/* Progress Bar of Daily Spend */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Đã chi: {formatVND(dailyAdvisor.mtdDailySpend)}</span>
            <span>Ngân sách định mức: {formatVND(dailyAdvisor.dailySpendBudget)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dailyAdvisor.mtdDailySpend > dailyAdvisor.dailySpendBudget
                  ? 'bg-rose-500'
                  : dailyAdvisor.mtdDailySpend > dailyAdvisor.dailySpendBudget * 0.8
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (dailyAdvisor.mtdDailySpend / (dailyAdvisor.dailySpendBudget || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. Family Financial Position (Tài sản & Số dư 3 tài khoản) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600" />
            <span>Tình hình tài sản gia đình</span>
          </h2>
          <button
            onClick={() => onNavigateToTab('more')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary 4 Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Available Cash (Tiền khả dụng) */}
          <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-sm relative hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-1">
              <span>Tiền khả dụng</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatVND(balances.availableCash)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sau khi trừ {formatVND(balances.reservedFunds, { compact: true })} quỹ
            </p>
          </div>

          {/* TK Thắng */}
          <div className="bg-white hover:border-slate-300 border border-slate-200 p-4 rounded-2xl shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
              <span>TK Thắng</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatVND(balances.tk_thang)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Tiền mặt & thẻ Thắng quản lý</p>
          </div>

          {/* TK Vân */}
          <div className="bg-white hover:border-slate-300 border border-slate-200 p-4 rounded-2xl shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs text-pink-700 font-semibold mb-1">
              <span>TK Vân</span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-pink-100" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {formatVND(balances.tk_van)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Tiền mặt & thẻ Vân quản lý</p>
          </div>

          {/* Tín dụng (Credit Liability) */}
          <div className="bg-white hover:border-slate-300 border border-slate-200 p-4 rounded-2xl shadow-sm transition-all">
            <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
              <span>Dư nợ Tín dụng</span>
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600">
              {formatVND(balances.tin_dung)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Hạn mức {formatVND(creditCardConfig.creditLimit, { compact: true })} &middot; Chốt ngày {creditCardConfig.statementDay}
            </p>
          </div>
        </div>

        {/* Secondary Asset Metrics Strip (Savings, Loans, Net Worth) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs shadow-sm">
          <div className="px-2 py-1">
            <span className="text-slate-500 block mb-0.5">Sổ tiết kiệm (Asset)</span>
            <span className="font-bold text-purple-700 text-sm">{formatVND(balances.totalSavings)}</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-slate-500 block mb-0.5">Cho bạn bè/người thân vay</span>
            <span className="font-bold text-cyan-700 text-sm">{formatVND(balances.totalReceivables)}</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-slate-500 block mb-0.5">Quỹ gom tiền đã giữ</span>
            <span className="font-bold text-amber-700 text-sm">{formatVND(balances.reservedFunds)}</span>
          </div>
          <div className="px-2 py-1 bg-indigo-50 rounded-xl border border-indigo-100">
            <span className="text-indigo-700 block mb-0.5 font-bold">TỔNG TÀI SẢN RÒNG</span>
            <span className="font-extrabold text-emerald-600 text-sm sm:text-base">
              {formatVND(balances.netWorth)}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Monthly Financial Overview (Section 13 & 33.2) */}
      <section className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Tổng kết {formatMonthVN(currentYM)}</span>
            </h3>
            <p className="text-xs text-slate-500">Doanh thu & Chi phí thực tế</p>
          </div>
          <button
            onClick={() => onNavigateToTab('insights')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Biểu đồ 12 tháng</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Income */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Tổng thu nhập</span>
            </div>
            <div className="text-base sm:text-xl font-extrabold text-emerald-600">
              +{formatVND(monthlyStats.income)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Thắng {formatVND(monthlyStats.byMember.thang.income, { compact: true })} | Vân {formatVND(monthlyStats.byMember.van.income, { compact: true })}
            </span>
          </div>

          {/* Expense */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold mb-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tổng chi tiêu</span>
            </div>
            <div className="text-base sm:text-xl font-extrabold text-rose-600">
              -{formatVND(monthlyStats.expense)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Thắng {formatVND(monthlyStats.byMember.thang.expense, { compact: true })} | Vân {formatVND(monthlyStats.byMember.van.expense, { compact: true })}
            </span>
          </div>

          {/* Net Cash Flow */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Dòng tiền ròng</span>
            </div>
            <div
              className={`text-base sm:text-xl font-extrabold ${
                monthlyStats.netCashFlow >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}
            >
              {formatVND(monthlyStats.netCashFlow, { showSign: true })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Tiền vào trừ Tiền ra</span>
          </div>

          {/* Net Income */}
          <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold mb-1">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Thặng dư tích lũy</span>
            </div>
            <div
              className={`text-base sm:text-xl font-extrabold ${
                monthlyStats.netIncome >= 0 ? 'text-purple-600' : 'text-rose-600'
              }`}
            >
              {formatVND(monthlyStats.netIncome, { showSign: true })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Thu nhập trừ Chi phí</span>
          </div>
        </div>
      </section>

      {/* 4. Upcoming Reminders & Actions (Section 33.5) */}
      <section className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 px-1">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Nhắc nhở & Kế hoạch sắp tới</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Credit Card Reminder */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-900">Thẻ {creditCardConfig.cardName}</span>
                <span className="text-amber-700 font-semibold">Chốt: {creditCardConfig.statementDay} hàng tháng</span>
              </div>
              <p className="text-slate-500">
                Dư nợ: <strong className="text-slate-900">{formatVND(balances.tin_dung)}</strong> &middot; Hạn trả ngày {creditCardConfig.dueDay}
              </p>
            </div>
          </div>

          {/* Savings Deposit Maturity */}
          {maturingSavings.length > 0 && (
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-200">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-slate-900">{maturingSavings[0].productName}</span>
                  <span className="text-purple-700 font-semibold">{formatDateVN(maturingSavings[0].maturityDate)}</span>
                </div>
                <p className="text-slate-500">
                  Gốc <strong className="text-slate-900">{formatVND(maturingSavings[0].principal)}</strong> ({maturingSavings[0].annualInterestRate}%/năm) &middot; Lãi dự kiến: +{formatVND(maturingSavings[0].expectedInterest)}
                </p>
              </div>
            </div>
          )}

          {/* Planned Large Expense */}
          {pendingPlanned.length > 0 && (
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-slate-900">{pendingPlanned[0].title}</span>
                  <span className="text-blue-700 font-semibold">{formatDateVN(pendingPlanned[0].expectedDate)}</span>
                </div>
                <p className="text-slate-500">
                  Dự kiến chi: <strong className="text-slate-900">{formatVND(pendingPlanned[0].expectedAmount)}</strong> &middot; Trạng thái: {pendingPlanned[0].status}
                </p>
              </div>
            </div>
          )}

          {/* Active Loan Reminder */}
          {activeLoans.length > 0 && (
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 border border-cyan-200">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-slate-900">Khoản cho vay: {activeLoans[0].note || 'Cho vay cá nhân'}</span>
                  <span className="text-cyan-700 font-semibold">Còn {formatVND(activeLoans[0].outstandingPrincipal)}</span>
                </div>
                <p className="text-slate-500">
                  Gốc {formatVND(activeLoans[0].principal)} &middot; Hạn dự kiến: {formatDateVN(activeLoans[0].expectedDueDate || '')}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Recent Transactions List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Giao dịch gần đây</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Chưa có giao dịch nào. Nhấn "+ Nhập nhanh" để thêm giao dịch đầu tiên!
            </div>
          ) : (
            recentTransactions.slice(0, 6).map((tx) => {
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
              const isIncome = tx.transactionType === 'INCOME';
              const isTransfer = tx.transactionType === 'TRANSFER';
              const isCredit = tx.transactionType === 'CREDIT_PURCHASE';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-3.5 sm:p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs border border-slate-200"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}15` : '#3b82f615',
                        color: cat?.color || '#4f46e5',
                      }}
                    >
                      <CategoryIcon iconName={cat?.icon || 'Tag'} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{formatDateVN(tx.transactionDate)}</span>
                        <span>&middot;</span>
                        <span className="capitalize">{cat?.name || 'Khác'}</span>
                        <span>&middot;</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] border ${
                            tx.memberId === 'van'
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {tx.memberId === 'van' ? 'Vân' : 'Thắng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div
                      className={`font-extrabold text-xs sm:text-sm ${
                        isIncome
                          ? 'text-emerald-600'
                          : isTransfer
                          ? 'text-indigo-600'
                          : isCredit
                          ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                      {formatVND(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {tx.sourceAccountId === 'tk_thang'
                        ? 'TK Thắng'
                        : tx.sourceAccountId === 'tk_van'
                        ? 'TK Vân'
                        : tx.sourceAccountId === 'tin_dung'
                        ? 'Thẻ Tín dụng'
                        : tx.transactionType}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
