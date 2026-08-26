import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Budget,
  IncomePlan,
  Category,
  Transaction,
  PlannedExpense,
  Goal,
  EventBudget,
  EventBudgetItem,
  EventContribution,
  RecurringTransaction,
  Member,
  FinancialAccount,
} from '../../types/finance';
import { formatVND, formatDateVN, formatMonthVN, getCurrentMonthStr, shiftMonth } from '../../lib/formatters';
import { AppState } from '../../lib/storage';
import { copyPlanMonth, ensurePlanMonth, filterBudgets, filterCategories, filterIncomePlans, monthHasPlanData } from '../../lib/planMonth';
import { CategoryIcon } from '../common/CategoryIcon';
import { PlanMonthBar } from './PlanMonthBar';
import { depositIntoGoal } from '../../lib/goals';
import {
  Target,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Plus,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Plane,
  Gift,
  Clock,
  Check,
  ChevronRight,
  ArrowRightLeft,
  Users,
  Pencil,
  Trash2,
  X,
  Wallet,
  Scale,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlanHubProps {
  appState: AppState;
  budgets: Budget[];
  incomePlans: IncomePlan[];
  categories: Category[];
  transactions: Transaction[];
  plannedExpenses: PlannedExpense[];
  goals: Goal[];
  events: EventBudget[];
  eventItems: EventBudgetItem[];
  eventContributions: EventContribution[];
  recurringTransactions: RecurringTransaction[];
  members: Member[];
  accounts: FinancialAccount[];
  onUpdateBudget: (budget: Budget) => void;
  onAddBudget?: (budget: Omit<Budget, 'id'>) => void;
  onDeleteBudget?: (id: string) => void;
  onUpdateCategory?: (category: Category) => void;
  onUpdateIncomePlan?: (ip: IncomePlan) => void;
  onAddIncomePlan?: (ip: Omit<IncomePlan, 'id'>) => void;
  onDeleteIncomePlan?: (id: string) => void;
  onAddPlannedExpense: (pe: Omit<PlannedExpense, 'id'>) => void;
  onUpdatePlannedExpense: (pe: PlannedExpense) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onAddEvent: (ev: Omit<EventBudget, 'id'>) => void;
  onConfirmRecurring: (rec: RecurringTransaction) => void;
  onApplyPlanState: (
    partial: Pick<AppState, 'categories' | 'budgets' | 'incomePlans'>
  ) => void;
}

export const PlanHub: React.FC<PlanHubProps> = ({
  appState,
  budgets,
  incomePlans,
  categories,
  transactions,
  plannedExpenses,
  goals,
  events,
  eventItems,
  eventContributions,
  recurringTransactions,
  members,
  accounts,
  onUpdateBudget,
  onAddBudget,
  onDeleteBudget,
  onUpdateCategory,
  onUpdateIncomePlan,
  onAddIncomePlan,
  onDeleteIncomePlan,
  onAddPlannedExpense,
  onUpdatePlannedExpense,
  onAddGoal,
  onUpdateGoal,
  onAddEvent,
  onConfirmRecurring,
  onApplyPlanState,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'budget' | 'goals_planned' | 'events' | 'recurring'
  >('budget');
  const [selectedPlanMonth, setSelectedPlanMonth] = useState(getCurrentMonthStr());
  const autoCopiedMonths = useRef(new Set<string>());

  const currentYM = selectedPlanMonth;
  const filteredCategories = useMemo(
    () => filterCategories(appState, selectedPlanMonth),
    [appState, selectedPlanMonth]
  );
  const filteredBudgets = useMemo(
    () => filterBudgets(appState, selectedPlanMonth),
    [appState, selectedPlanMonth]
  );
  const filteredIncomePlans = useMemo(
    () => filterIncomePlans(appState, selectedPlanMonth),
    [appState, selectedPlanMonth]
  );
  const categoryMap = useMemo(() => new Map(filteredCategories.map((c) => [c.id, c])), [filteredCategories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    if (autoCopiedMonths.current.has(selectedPlanMonth)) return;
    const result = ensurePlanMonth(appState, selectedPlanMonth);
    autoCopiedMonths.current.add(selectedPlanMonth);
    if (result.didAutoCopy) {
      onApplyPlanState({
        categories: result.state.categories,
        budgets: result.state.budgets,
        incomePlans: result.state.incomePlans,
      });
    }
  }, [appState, onApplyPlanState, selectedPlanMonth]);

  const handleCopyPrevious = () => {
    if (monthHasPlanData(appState, selectedPlanMonth) &&
        !window.confirm('Tháng này đã có dữ liệu — ghi đè?')) {
      return;
    }
    const copied = copyPlanMonth(
      appState,
      shiftMonth(selectedPlanMonth, -1),
      selectedPlanMonth,
      { overwrite: true }
    );
    onApplyPlanState({
      categories: copied.categories,
      budgets: copied.budgets,
      incomePlans: copied.incomePlans,
    });
  };

  // Actual category spending this month
  const actualCategorySpending = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => !t.deletedAt && t.transactionDate.startsWith(selectedPlanMonth))
      .forEach((t) => {
        if (
          t.categoryId &&
          (t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_PURCHASE')
        ) {
          map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
        } else if (t.categoryId && (t.transactionType === 'REFUND' || t.transactionType === 'CREDIT_REFUND')) {
          map.set(t.categoryId, (map.get(t.categoryId) || 0) - t.amount);
        }
      });
    return map;
  }, [transactions, selectedPlanMonth]);

  // Actual income this month total
  const actualIncome = useMemo(() => {
    let sum = 0;
    transactions
      .filter((t) => !t.deletedAt && t.transactionDate.startsWith(selectedPlanMonth) && t.transactionType === 'INCOME')
      .forEach((t) => {
        sum += t.amount;
      });
    return sum;
  }, [transactions, selectedPlanMonth]);

  // Actual income received per member
  const actualIncomeByMember = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => !t.deletedAt && t.transactionDate.startsWith(selectedPlanMonth) && t.transactionType === 'INCOME')
      .forEach((t) => {
        map.set(t.memberId, (map.get(t.memberId) || 0) + t.amount);
      });
    return map;
  }, [transactions, selectedPlanMonth]);

  // Total actual spending this month
  const totalActualExpense = useMemo(() => {
    let sum = 0;
    actualCategorySpending.forEach((v) => {
      if (v > 0) sum += v;
    });
    return sum;
  }, [actualCategorySpending]);

  // Planned totals & Calculations
  const totalPlannedIncome = useMemo(
    () => filteredIncomePlans.reduce((sum, ip) => sum + (ip.expectedAmount || 0), 0),
    [filteredIncomePlans]
  );

  const totalExpenseBudget = useMemo(
    () =>
      filteredBudgets
        .filter((b) => b.budgetType === 'EXPENSE_LIMIT')
        .reduce((sum, b) => sum + (b.plannedAmount || 0), 0),
    [filteredBudgets]
  );

  // Net Planned Balance: Planned Income - Planned Expense Budgets
  const plannedNetBalance = totalPlannedIncome - totalExpenseBudget;
  const isPlannedSurplus = plannedNetBalance >= 0;
  const plannedSavingRate =
    totalPlannedIncome > 0 ? Math.round((plannedNetBalance / totalPlannedIncome) * 100) : 0;

  // Actual Net Cash Flow this month
  const actualNetBalance = actualIncome - totalActualExpense;

  // Modals for adding items
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [showAddPlannedModal, setShowAddPlannedModal] = useState(false);
  const [newPlannedTitle, setNewPlannedTitle] = useState('');
  const [newPlannedAmount, setNewPlannedAmount] = useState('');
  const [newPlannedDate, setNewPlannedDate] = useState('');

  // Modals for Category Budget
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetPlannedAmount, setBudgetPlannedAmount] = useState('');
  const [budgetDailySpend, setBudgetDailySpend] = useState(false);

  // Modals for Income Plan (Lương & Thu nhập dự kiến)
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [editingIncomePlan, setEditingIncomePlan] = useState<IncomePlan | null>(null);
  const [incomeSourceName, setIncomeSourceName] = useState('');
  const [incomeMemberId, setIncomeMemberId] = useState('thang');
  const [incomeExpectedAmount, setIncomeExpectedAmount] = useState('');

  const handleOpenAddIncome = () => {
    setEditingIncomePlan(null);
    setIncomeSourceName('');
    setIncomeMemberId(members[0]?.id || 'thang');
    setIncomeExpectedAmount('');
    setShowAddIncomeModal(true);
  };

  const handleOpenEditIncome = (ip: IncomePlan) => {
    setEditingIncomePlan(ip);
    setIncomeSourceName(ip.sourceName);
    setIncomeMemberId(ip.memberId);
    setIncomeExpectedAmount(ip.expectedAmount.toString());
    setShowAddIncomeModal(true);
  };

  const handleSaveIncomePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeSourceName.trim()) {
      alert('Vui lòng nhập tên nguồn thu nhập (VD: Lương Thắng, Lương Vân...)');
      return;
    }
    const amount = parseInt(incomeExpectedAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (amount <= 0) {
      alert('Vui lòng nhập số tiền dự kiến lớn hơn 0');
      return;
    }

    if (editingIncomePlan) {
      if (onUpdateIncomePlan) {
        onUpdateIncomePlan({
          ...editingIncomePlan,
          sourceName: incomeSourceName.trim(),
          memberId: incomeMemberId,
          expectedAmount: amount,
        });
      }
    } else {
      if (onAddIncomePlan) {
        onAddIncomePlan({
          month: currentYM,
          sourceName: incomeSourceName.trim(),
          memberId: incomeMemberId,
          expectedAmount: amount,
        });
      }
    }
    setShowAddIncomeModal(false);
    setEditingIncomePlan(null);
  };

  const handleDeleteIncomePlan = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nguồn thu nhập dự kiến này?')) {
      if (onDeleteIncomePlan) {
        onDeleteIncomePlan(id);
      }
      setShowAddIncomeModal(false);
      setEditingIncomePlan(null);
    }
  };

  const handleOpenAddBudget = () => {
    const expenseCats = filteredCategories.filter((c) => c.kind === 'EXPENSE' || c.kind === 'BOTH');
    const existingBudgetCatIds = new Set(
      filteredBudgets.filter((b) => b.budgetType === 'EXPENSE_LIMIT').map((b) => b.categoryId)
    );
    const availableCat = expenseCats.find((c) => !existingBudgetCatIds.has(c.id)) || expenseCats[0];
    setBudgetCategoryId(availableCat ? availableCat.id : '');
    setBudgetPlannedAmount('');
    setBudgetDailySpend(availableCat?.dailySpend ?? false);
    setShowAddBudgetModal(true);
  };

  const handleOpenEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setBudgetCategoryId(b.categoryId);
    setBudgetPlannedAmount(b.plannedAmount.toString());
    setBudgetDailySpend(categoryMap.get(b.categoryId)?.dailySpend ?? false);
  };

  const handleBudgetCategoryChange = (categoryId: string) => {
    setBudgetCategoryId(categoryId);
    setBudgetDailySpend(categoryMap.get(categoryId)?.dailySpend ?? false);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategoryId) return;
    const amount = parseInt(budgetPlannedAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (amount <= 0) {
      alert('Vui lòng nhập hạn mức lớn hơn 0');
      return;
    }

    const cat = categoryMap.get(budgetCategoryId);
    if (cat && onUpdateCategory && cat.dailySpend !== budgetDailySpend) {
      onUpdateCategory({ ...cat, dailySpend: budgetDailySpend });
    }

    if (editingBudget) {
      onUpdateBudget({
        ...editingBudget,
        categoryId: budgetCategoryId,
        plannedAmount: amount,
      });
      setEditingBudget(null);
    } else {
      if (onAddBudget) {
        onAddBudget({
          month: currentYM,
          categoryId: budgetCategoryId,
          budgetType: 'EXPENSE_LIMIT',
          plannedAmount: amount,
        });
      }
      setShowAddBudgetModal(false);
    }
  };

  const handleDeleteBudget = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa hạn mức của danh mục này không?')) {
      if (onDeleteBudget) {
        onDeleteBudget(id);
      }
      setEditingBudget(null);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    onAddGoal({
      title: newGoalTitle.trim(),
      goalType: 'PURCHASE',
      targetAmount: parseInt(newGoalTarget.replace(/[^0-9]/g, ''), 10) || 5_000_000,
      savedAmount: 0,
      status: 'PLANNING',
      priority: 'HIGH',
    });
    setNewGoalTitle('');
    setNewGoalTarget('');
    setShowAddGoalModal(false);
  };

  const handleDepositGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amount = parseInt(depositAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) return;
    onUpdateGoal(depositIntoGoal(depositGoal, amount));
    setDepositGoal(null);
    setDepositAmount('');
  };

  const handleCreatePlanned = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlannedTitle.trim()) return;
    onAddPlannedExpense({
      title: newPlannedTitle.trim(),
      expectedAmount: parseInt(newPlannedAmount.replace(/[^0-9]/g, ''), 10) || 3_000_000,
      expectedDate: newPlannedDate || `${currentYM}-28`,
      priority: 'HIGH',
      status: 'PLANNED',
    });
    setNewPlannedTitle('');
    setNewPlannedAmount('');
    setNewPlannedDate('');
    setShowAddPlannedModal(false);
  };

  return (
    <div className="space-y-5 pb-20">
      <PlanMonthBar
        month={selectedPlanMonth}
        onMonthChange={setSelectedPlanMonth}
        onCopyPrevious={handleCopyPrevious}
        copyDisabled={!monthHasPlanData(appState, shiftMonth(selectedPlanMonth, -1))}
      />
      {/* Tab Navigation Pill Bar - Clean Light Mode */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm text-xs">
        <button
          onClick={() => setActiveSubTab('budget')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'budget'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Ngân sách {formatMonthVN(currentYM)}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('goals_planned')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'goals_planned'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chi lớn & Mục tiêu</span>
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'events'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Sự kiện ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('recurring')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'recurring'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Giao dịch định kỳ</span>
        </button>
      </div>

      {/* 1. Sub-Tab: BUDGET & INCOME */}
      {activeSubTab === 'budget' && (
        <div className="space-y-5">
          {/* FEATURE 1: CÂN ĐỐI KẾ HOẠCH THÁNG (ÂM HAY DƯƠNG BAO NHIÊU) */}
          <div
            className={`rounded-3xl p-5 border shadow-sm transition-all ${
              isPlannedSurplus
                ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-emerald-200/80 text-emerald-950'
                : 'bg-gradient-to-br from-rose-50/80 via-white to-orange-50/60 border-rose-200/80 text-rose-950'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                      isPlannedSurplus
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-900">
                      <span>Cân đối Kế hoạch {formatMonthVN(currentYM)}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                          isPlannedSurplus
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isPlannedSurplus ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>Kế hoạch DƯƠNG</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            <span>Kế hoạch ÂM (Bội chi)</span>
                          </>
                        )}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      So sánh Tổng thu nhập dự kiến với Tổng hạn mức chi tiêu đã phân bổ
                    </p>
                  </div>
                </div>
              </div>

              {/* Surplus / Deficit Big Badge */}
              <div
                className={`p-4 rounded-2xl border flex flex-col md:items-end justify-center ${
                  isPlannedSurplus
                    ? 'bg-emerald-500/10 border-emerald-300/60'
                    : 'bg-rose-500/10 border-rose-300/60'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {isPlannedSurplus ? 'Thặng dư kế hoạch' : 'Thâm hụt kế hoạch'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isPlannedSurplus ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isPlannedSurplus ? '+' : ''}
                    {formatVND(plannedNetBalance)}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-600 mt-0.5">
                  {isPlannedSurplus
                    ? `Dự kiến tích lũy ~${plannedSavingRate}% tổng thu nhập`
                    : `Hạn mức chi đang vượt thu nhập ${formatVND(Math.abs(plannedNetBalance))}`}
                </span>
              </div>
            </div>

            {/* 3 Pillars Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/70 text-xs">
              {/* Planned Income */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Thu nhập kế hoạch</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                    {incomePlans.length} nguồn thu
                  </span>
                </div>
                <div className="text-base font-extrabold text-emerald-600">
                  +{formatVND(totalPlannedIncome)}
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                  <span>Thực nhận hiện tại:</span>
                  <strong className="text-slate-700">{formatVND(actualIncome)}</strong>
                </div>
              </div>

              {/* Planned Expense Budgets */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hạn mức chi kế hoạch</span>
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                    {filteredBudgets.filter((b) => b.budgetType === 'EXPENSE_LIMIT').length} danh mục
                  </span>
                </div>
                <div className="text-base font-extrabold text-rose-600">
                  -{formatVND(totalExpenseBudget)}
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                  <span>Thực tế đã chi:</span>
                  <strong className="text-slate-700">{formatVND(totalActualExpense)}</strong>
                </div>
              </div>

              {/* Actual Net Realized vs Planned */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dòng tiền thực tế hiện tại</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      actualNetBalance >= 0
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {actualNetBalance >= 0 ? 'Dương' : 'Âm'}
                  </span>
                </div>
                <div
                  className={`text-base font-extrabold ${
                    actualNetBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'
                  }`}
                >
                  {actualNetBalance >= 0 ? '+' : ''}
                  {formatVND(actualNetBalance)}
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                  <span>Tiền dành cho Wishlist:</span>
                  <strong className="text-slate-700">{formatVND(appState.goals.reduce((sum, goal) => sum + goal.savedAmount, 0))}</strong>
                </div>
              </div>
            </div>

            {/* Advisory status footer */}
            <div className="mt-3.5 pt-3 border-t border-slate-200/70 text-xs flex items-center gap-2">
              {isPlannedSurplus ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-600">
                    Kế hoạch thu chi tháng này được cân đối an toàn. Thặng dư{' '}
                    <strong className="text-emerald-700">{formatVND(plannedNetBalance)}</strong> có thể
                    được phân bổ vào Wishlist hoặc Sổ tiết kiệm.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="text-rose-700 font-medium">
                    Tổng ngân sách chi tiêu đang vượt thu nhập dự kiến{' '}
                    <strong>{formatVND(Math.abs(plannedNetBalance))}</strong>. Bạn nên giảm bớt hạn mức
                    các danh mục không thiết yếu để đảm bảo kế hoạch không bị âm.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* FEATURE 2: KẾ HOẠCH THU NHẬP & LƯƠNG THÁNG (CHO PHÉP EDIT) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Kế hoạch thu nhập & lương tháng</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Lương cố định, thưởng, làm thêm và các nguồn thu dự kiến trong tháng (nhấn &quot;Sửa&quot; để cập nhật)
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddIncome}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm nguồn thu</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredIncomePlans.map((ip) => {
                const mem = memberMap.get(ip.memberId);
                const memActualIncome = actualIncomeByMember.get(ip.memberId) || 0;

                return (
                  <div
                    key={ip.id}
                    className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl flex flex-col justify-between gap-3 text-xs hover:border-slate-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs"
                            style={{ backgroundColor: mem?.avatarColor || '#3b82f6' }}
                          />
                          <span className="font-bold text-slate-900 text-sm">{ip.sourceName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
                            {mem?.name || ip.memberId}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] block">
                          Tháng áp dụng: {formatMonthVN(ip.month || currentYM)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditIncome(ip)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer shadow-2xs"
                        title="Chỉnh sửa nguồn thu"
                      >
                        <Pencil className="w-3 h-3 text-indigo-600" />
                        <span>Sửa</span>
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Lương / Thu dự kiến
                        </span>
                        <span className="text-base font-extrabold text-emerald-600">
                          {formatVND(ip.expectedAmount)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Thực nhận tháng này
                        </span>
                        <span className="text-sm font-extrabold text-slate-800">
                          {formatVND(memActualIncome)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredIncomePlans.length === 0 && (
                <div className="col-span-full p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  Chưa có nguồn thu nhập dự kiến nào. Nhấn &quot;Thêm nguồn thu&quot; để bắt đầu lập kế hoạch.
                </div>
              )}
            </div>
          </div>

          {/* Expense Category Budgets */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Hạn mức ngân sách từng danh mục chi tiêu</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi Dự kiến / Thực tế / Còn lại và tỷ lệ sử dụng ngân sách {formatMonthVN(currentYM)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddBudget}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm hạn mức</span>
              </button>
            </div>

            <div className="space-y-3">
              {[...filteredBudgets]
                .filter((b) => b.budgetType === 'EXPENSE_LIMIT')
                .sort((a, b) => {
                  const dailyA = categoryMap.get(a.categoryId)?.dailySpend ? 1 : 0;
                  const dailyB = categoryMap.get(b.categoryId)?.dailySpend ? 1 : 0;
                  if (dailyA !== dailyB) return dailyB - dailyA;

                  const actualA = actualCategorySpending.get(a.categoryId) || 0;
                  const actualB = actualCategorySpending.get(b.categoryId) || 0;
                  const remainPctA =
                    a.plannedAmount > 0
                      ? ((a.plannedAmount - actualA) / a.plannedAmount) * 100
                      : 0;
                  const remainPctB =
                    b.plannedAmount > 0
                      ? ((b.plannedAmount - actualB) / b.plannedAmount) * 100
                      : 0;
                  return remainPctB - remainPctA;
                })
                .map((b) => {
                  const cat = categoryMap.get(b.categoryId);
                  const actual = actualCategorySpending.get(b.categoryId) || 0;
                  const remaining = b.plannedAmount - actual;
                  const pct = Math.round((actual / (b.plannedAmount || 1)) * 100);
                  const isOver = remaining < 0;

                  return (
                    <div
                      key={b.id}
                      className="bg-slate-50 border border-slate-200/90 p-4 rounded-2xl space-y-2.5 text-xs hover:border-slate-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 font-bold text-slate-900 min-w-0">
                          <span
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 shadow-2xs flex-shrink-0"
                            style={{
                              backgroundColor: cat?.color ? `${cat.color}15` : '#3b82f615',
                              color: cat?.color || '#2563eb',
                            }}
                          >
                            <CategoryIcon iconName={cat?.icon} className="w-4 h-4" />
                          </span>
                          <span className="text-sm truncate">{cat?.name || 'Khác'}</span>
                          {cat?.dailySpend && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex-shrink-0 font-medium">
                              Chi hàng ngày
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <div className="text-right">
                            <span
                              className={`font-extrabold text-sm ${
                                isOver ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {formatVND(actual)}
                            </span>
                            <span className="text-slate-500 text-xs"> / {formatVND(b.plannedAmount)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenEditBudget(b)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 text-[11px] font-semibold cursor-pointer shadow-2xs"
                            title="Sửa hạn mức danh mục"
                          >
                            <Pencil className="w-3 h-3 text-indigo-600" />
                            <span>Sửa</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver
                              ? 'bg-rose-500'
                              : pct > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Đã dùng: <strong className="text-slate-700">{pct}%</strong></span>
                        <span className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                          {isOver
                            ? `Bội chi ${formatVND(Math.abs(remaining))}`
                            : `Còn lại: ${formatVND(remaining)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Sub-Tab: GOALS & PLANNED EXPENSES */}
      {activeSubTab === 'goals_planned' && (
        <div className="space-y-5">
          {/* Planned Large Expenses (>3M) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Kế hoạch chi lớn (&gt; 3.000.000 ₫)</span>
                </h3>
                <p className="text-xs text-slate-500">Dự phòng trước dòng tiền để không bị động</p>
              </div>
              <button
                onClick={() => setShowAddPlannedModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm khoản</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plannedExpenses.map((pe) => (
                <div
                  key={pe.id}
                  className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between text-xs shadow-sm hover:border-slate-300 transition-all"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{pe.title}</h4>
                    <span className="text-slate-500 block mt-0.5">
                      Dự kiến chi: <strong>{formatDateVN(pe.expectedDate)}</strong>
                    </span>
                    {pe.note && <span className="text-slate-400 italic block mt-0.5">{pe.note}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-blue-600 block">
                      {formatVND(pe.expectedAmount)}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-slate-100 border border-slate-200 text-slate-700">
                      {pe.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals / Wishlist */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Mục tiêu mua sắm & Ước mơ (Wishlist)</span>
                </h3>
                <p className="text-xs text-slate-500">Các món đồ muốn sắm trong tương lai</p>
              </div>
              <button
                onClick={() => setShowAddGoalModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm mục tiêu</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {goals.map((g) => {
                const isDone = g.status === 'DONE';
                const pct = Math.round((g.savedAmount / (g.targetAmount || 1)) * 100);

                return (
                  <div
                    key={g.id}
                    className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 text-xs shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{g.title}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {isDone ? 'Đã hoàn thành' : `${pct}%`}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Đã có: {formatVND(g.savedAmount)}</span>
                      <span>Mục tiêu: {formatVND(g.targetAmount)}</span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    {g.status !== 'DONE' && g.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => {
                          setDepositGoal(g);
                          setDepositAmount('');
                        }}
                        className="w-full py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        + Nạp
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab: EVENTS & TRIP SETTLEMENT */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Quản lý Sự kiện & Chuyến đi</h3>
              <p className="text-xs text-slate-500">
                Theo dõi ngân sách du lịch, cưới hỏi, mừng thôi nôi và chia tiền
              </p>
            </div>
          </div>

          {events.map((ev) => {
            const items = eventItems.filter((i) => i.eventId === ev.id);
            const contributions = eventContributions.filter((c) => c.eventId === ev.id);
            const totalPlanned = items.reduce((sum, i) => sum + i.plannedAmount, 0);
            const totalActual = items.reduce((sum, i) => sum + i.actualAmount, 0);
            const totalGifts = contributions.reduce((sum, c) => sum + c.amount, 0);

            return (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{ev.name}</h4>
                      <span className="text-xs text-slate-500">
                        {formatDateVN(ev.startDate)} {ev.endDate && `- ${formatDateVN(ev.endDate)}`} &middot; {ev.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Ngân sách dự kiến
                    </span>
                    <span className="text-base font-extrabold text-indigo-600">
                      {formatVND(ev.budgetAmount || totalPlanned)}
                    </span>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700">Hạng mục chi phí dự kiến:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 block">{item.title}</span>
                          <span className="text-[10px] text-slate-500">{item.status}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800">
                            {formatVND(item.plannedAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contributions / Gifts if any */}
                {contributions.length > 0 && (
                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1.5">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>Đóng góp / Tiền mừng nhận được:</span>
                    </div>
                    {contributions.map((c) => (
                      <div key={c.id} className="flex justify-between text-slate-700 text-xs py-0.5">
                        <span>{c.note || 'Khoản đóng góp'}</span>
                        <span className="font-bold text-emerald-700">+{formatVND(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Sub-Tab: RECURRING TRANSACTIONS */}
      {activeSubTab === 'recurring' && (
        <div className="space-y-4">
          <div className="px-1">
            <h3 className="text-base font-bold text-slate-900">Giao dịch định kỳ hàng tháng</h3>
            <p className="text-xs text-slate-500">
              Nhắc nhở lương, tiền nhà, tiền mạng, hóa đơn cố định. Xác nhận 1-click khi có phát sinh thực tế.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {recurringTransactions.map((rec) => {
              const isIncome = rec.type === 'INCOME';
              const mem = memberMap.get(rec.memberId);

              return (
                <div
                  key={rec.id}
                  className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span>{rec.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isIncome ? 'Thu nhập' : 'Chi phí'}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] block">
                      Định kỳ ngày {rec.dayOfMonth} hàng tháng &middot; Người thực hiện:{' '}
                      <strong className="text-slate-700">{mem?.name || rec.memberId}</strong>
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span
                      className={`text-sm font-extrabold ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatVND(rec.amount)}
                    </span>
                    <button
                      onClick={() => onConfirmRecurring(rec)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Xác nhận ghi sổ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT INCOME PLAN (LƯƠNG & THU NHẬP DỰ KIẾN) */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveIncomePlan}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 space-y-4 text-xs shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{editingIncomePlan ? 'Chỉnh sửa nguồn thu nhập' : 'Thêm nguồn thu nhập dự kiến'}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddIncomeModal(false);
                  setEditingIncomePlan(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tên nguồn thu / Lương</label>
              <input
                type="text"
                placeholder="VD: Lương Thắng, Lương Vân, Thưởng dự án..."
                value={incomeSourceName}
                onChange={(e) => setIncomeSourceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Thành viên nhận</label>
              <select
                value={incomeMemberId}
                onChange={(e) => setIncomeMemberId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id === 'thang' ? 'Chồng' : m.id === 'van' ? 'Vợ' : 'Gia đình'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Số tiền dự kiến {formatMonthVN(currentYM)} (VND)
              </label>
              <input
                type="text"
                placeholder="VD: 43000000"
                value={
                  incomeExpectedAmount
                    ? parseInt(incomeExpectedAmount.replace(/[^0-9]/g, ''), 10).toLocaleString('vi-VN')
                    : ''
                }
                onChange={(e) => setIncomeExpectedAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-emerald-700 font-bold text-base focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Thu nhập dự kiến dùng để tính toán thặng dư / cân đối kế hoạch tài chính trong tháng.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              {editingIncomePlan && (
                <button
                  type="button"
                  onClick={() => handleDeleteIncomePlan(editingIncomePlan.id)}
                  className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Xóa nguồn thu"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowAddIncomeModal(false);
                  setEditingIncomePlan(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer"
              >
                {editingIncomePlan ? 'Cập nhật' : 'Lưu nguồn thu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Category Budget */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveBudget}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Thêm hạn mức ngân sách</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddBudgetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Danh mục chi tiêu</label>
              <select
                value={budgetCategoryId}
                onChange={(e) => handleBudgetCategoryChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
                autoFocus
              >
                <option value="">-- Chọn danh mục --</option>
                {filteredCategories
                  .filter((c) => c.kind === 'EXPENSE' || c.kind === 'BOTH')
                  .map((cat) => {
                    const hasBudget = filteredBudgets.some(
                      (b) => b.categoryId === cat.id && b.budgetType === 'EXPENSE_LIMIT'
                    );
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {hasBudget ? '(Đã có hạn mức - sẽ cập nhật)' : ''}
                      </option>
                    );
                  })}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">
                Hạn mức ngân sách {formatMonthVN(currentYM)} (VND)
              </label>
              <input
                type="text"
                placeholder="VD: 5000000"
                value={
                  budgetPlannedAmount
                    ? parseInt(budgetPlannedAmount.replace(/[^0-9]/g, ''), 10).toLocaleString('vi-VN')
                    : ''
                }
                onChange={(e) => setBudgetPlannedAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Số tiền tối đa dự kiến chi cho danh mục này trong tháng.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors">
              <input
                type="checkbox"
                checked={budgetDailySpend}
                onChange={(e) => setBudgetDailySpend(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                <span className="block font-semibold text-slate-800">Tính vào chi tiêu hàng ngày</span>
                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Bật thì hạn mức và chi thực tế của danh mục này đi vào Cố vấn chi tiêu hàng ngày.
                </span>
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBudgetModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer"
              >
                Lưu hạn mức
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Category Budget */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveBudget}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-600" />
                <span>Sửa hạn mức danh mục</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Danh mục</label>
              <select
                value={budgetCategoryId}
                onChange={(e) => handleBudgetCategoryChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                {filteredCategories
                  .filter((c) => c.kind === 'EXPENSE' || c.kind === 'BOTH')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">
                Hạn mức ngân sách (VND)
              </label>
              <input
                type="text"
                placeholder="VD: 5000000"
                value={
                  budgetPlannedAmount
                    ? parseInt(budgetPlannedAmount.replace(/[^0-9]/g, ''), 10).toLocaleString('vi-VN')
                    : ''
                }
                onChange={(e) => setBudgetPlannedAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
                autoFocus
              />
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-indigo-50/40 hover:border-indigo-200 transition-colors">
              <input
                type="checkbox"
                checked={budgetDailySpend}
                onChange={(e) => setBudgetDailySpend(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                <span className="block font-semibold text-slate-800">Tính vào chi tiêu hàng ngày</span>
                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Bật thì hạn mức và chi thực tế của danh mục này đi vào Cố vấn chi tiêu hàng ngày.
                </span>
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDeleteBudget(editingBudget.id)}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Xóa hạn mức"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer"
              >
                Cập nhật
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Deposit into Goal */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleDepositGoal}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <h4 className="font-bold text-base text-slate-900">Nạp vào {depositGoal.title}</h4>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số tiền cần nạp (VND)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="VD: 2000000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDepositGoal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
              >
                Nạp tiền
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Goal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateGoal}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <h4 className="font-bold text-base text-slate-900">Thêm mục tiêu / Wishlist</h4>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tên món đồ / Mục tiêu</label>
              <input
                type="text"
                placeholder="VD: Máy rửa bát Bosch..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số tiền mục tiêu (VND)</label>
              <input
                type="text"
                placeholder="VD: 15000000"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddGoalModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
              >
                Lưu mục tiêu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Planned Expense */}
      {showAddPlannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreatePlanned}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <h4 className="font-bold text-base text-slate-900">Thêm khoản chi lớn (&gt;3M)</h4>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tiêu đề</label>
              <input
                type="text"
                placeholder="VD: Đóng bảo hiểm, Mua đồ gia dụng..."
                value={newPlannedTitle}
                onChange={(e) => setNewPlannedTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số tiền dự kiến (VND)</label>
              <input
                type="text"
                placeholder="VD: 4500000"
                value={newPlannedAmount}
                onChange={(e) => setNewPlannedAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Ngày dự kiến</label>
              <input
                type="date"
                value={newPlannedDate}
                onChange={(e) => setNewPlannedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPlannedModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
              >
                Lưu kế hoạch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
