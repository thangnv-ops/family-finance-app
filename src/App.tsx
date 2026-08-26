/**
 * Family Finance App - Thắng & Vân 2026
 * Primary Controller & Main Application Layout
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  exportAppStateAsJSON,
  importAppStateFromJSON,
} from './lib/storage';
import { createEmptyAppState } from './lib/emptyState';
import { loadAppStateFromDb } from './lib/db/loadState';
import { syncAppState } from './lib/db/syncState';
import { useAuthSession } from './hooks/useAuthSession';
import {
  calculateBalances,
  calculateMonthlyStats,
  calculateDailyAdvisor,
} from './lib/ledger';
import { getCurrentMonthStr, getTodayDateStr } from './lib/formatters';
import {
  Transaction,
  FinancialAccount,
  SavingsDeposit,
  Loan,
  Fund,
  PlannedExpense,
  Goal,
  EventBudget,
  Budget,
  RecurringTransaction,
  SuggestionRule,
} from './types/finance';

import { Header } from './components/common/Header';
import { BottomNav, ActiveTab } from './components/common/BottomNav';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { TransactionList } from './components/transactions/TransactionList';
import { QuickTransactionModal } from './components/transactions/QuickTransactionModal';
import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';
import { PlanHub } from './components/plan/PlanHub';
import { InsightsView } from './components/insights/InsightsView';
import { MoreHub } from './components/more/MoreHub';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { LoginScreen } from './components/auth/LoginScreen';
import { AccessDeniedScreen } from './components/auth/AccessDeniedScreen';
import { AppLoadingScreen } from './components/auth/AppLoadingScreen';

export default function App() {
  const auth = useAuthSession();

  if (auth.status === 'loading') {
    return <AppLoadingScreen />;
  }
  if (auth.status === 'signed_out') {
    return <LoginScreen onGoogle={auth.signInWithGoogle} error={auth.error} />;
  }
  if (auth.status === 'forbidden') {
    return (
      <AccessDeniedScreen
        onSignOut={auth.signOut}
        email={auth.email}
        error={auth.error}
      />
    );
  }
  if (!auth.householdId) {
    return <AppLoadingScreen error={auth.error} onRetry={auth.refresh} />;
  }

  return <AuthenticatedApp householdId={auth.householdId} />;
}

function AuthenticatedApp({
  householdId,
}: {
  householdId: string;
}) {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [prevState, setPrevState] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const state = await loadAppStateFromDb(householdId);
      setAppState(state);
      setPrevState(state);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
      setAppState(null);
      setPrevState(null);
    }
  }, [householdId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!appState || !prevState) return;
    if (appState === prevState) return;
    const handle = setTimeout(async () => {
      const snapshot = appState;
      const baseline = prevState;
      try {
        await syncAppState(householdId, baseline, snapshot);
        setPrevState(snapshot);
        setSaveError(null);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Lưu thất bại');
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [appState, prevState, householdId]);

  const currentYM = getCurrentMonthStr();
  const balances = useMemo(() => {
    if (!appState) {
      return {
        tk_thang: 0,
        tk_van: 0,
        tin_dung: 0,
        totalCash: 0,
        availableCash: 0,
        reservedFunds: 0,
        totalSavings: 0,
        totalReceivables: 0,
        totalPayables: 0,
        netWorth: 0,
      };
    }
    return calculateBalances(
      appState.accounts,
      appState.transactions,
      appState.savingsDeposits,
      appState.loans,
      appState.funds
    );
  }, [
    appState?.accounts,
    appState?.transactions,
    appState?.savingsDeposits,
    appState?.loans,
    appState?.funds,
  ]);

  const monthlyStats = useMemo(() => {
    if (!appState) {
      return calculateMonthlyStats(currentYM, [], [], []);
    }
    return calculateMonthlyStats(
      currentYM,
      appState.transactions,
      appState.categories,
      appState.budgets
    );
  }, [currentYM, appState?.transactions, appState?.categories, appState?.budgets]);

  const dailyAdvisor = useMemo(() => {
    if (!appState) {
      return calculateDailyAdvisor([], [], [], currentYM);
    }
    return calculateDailyAdvisor(
      appState.transactions,
      appState.categories,
      appState.budgets,
      currentYM
    );
  }, [appState?.transactions, appState?.categories, appState?.budgets, currentYM]);

  const visibleTransactions = useMemo(() => {
    if (!appState) return [];
    const active = appState.transactions.filter((t) => !t.deletedAt);
    if (appState.currentMemberId === 'all') return active;
    return active.filter((t) => t.memberId === appState.currentMemberId);
  }, [appState?.transactions, appState?.currentMemberId]);

  if (!appState) {
    return <AppLoadingScreen error={loadError} onRetry={reload} />;
  }

  // Handler: Save new transaction
  const handleSaveTransaction = (
    newTx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const created: Transaction = {
      ...newTx,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      transactions: [created, ...prev.transactions],
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          entityType: 'TRANSACTION',
          entityId: id,
          action: 'CREATE',
          description: `Tạo giao dịch mới: ${created.description} (${created.amount.toLocaleString('vi-VN')} ₫)`,
          userId: created.memberId,
          timestamp: nowIso,
        },
        ...prev.auditLogs,
      ],
    }));
  };

  // Handler: Update transaction
  const handleUpdateTransaction = (updated: Transaction) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === updated.id ? updated : t)),
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          entityType: 'TRANSACTION',
          entityId: updated.id,
          action: 'UPDATE',
          description: `Cập nhật giao dịch: ${updated.description}`,
          userId: updated.memberId,
          timestamp: new Date().toISOString(),
        },
        ...prev.auditLogs,
      ],
    }));
    setSelectedTx(null);
  };

  // Handler: Soft Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
      ),
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          entityType: 'TRANSACTION',
          entityId: id,
          action: 'DELETE',
          description: `Xóa giao dịch ID ${id}`,
          userId: prev.currentMemberId === 'van' ? 'van' : 'thang',
          timestamp: new Date().toISOString(),
        },
        ...prev.auditLogs,
      ],
    }));
    setSelectedTx(null);
  };

  // Handler: Duplicate transaction
  const handleDuplicateTransaction = (tx: Transaction) => {
    handleSaveTransaction({
      transactionDate: getTodayDateStr(),
      transactionType: tx.transactionType,
      amount: tx.amount,
      currency: 'VND',
      description: `${tx.description} (Sao chép)`,
      note: tx.note,
      categoryId: tx.categoryId,
      sourceAccountId: tx.sourceAccountId,
      destinationAccountId: tx.destinationAccountId,
      memberId: tx.memberId,
      eventId: tx.eventId,
      fundId: tx.fundId,
      counterpartyId: tx.counterpartyId,
    });
  };

  // Handler: Reconcile Balance (Section 32)
  const handleReconcileAccount = (
    accountId: string,
    actualBalance: number,
    reason: string
  ) => {
    const currentBal =
      accountId === 'tk_thang'
        ? balances.tk_thang
        : accountId === 'tk_van'
        ? balances.tk_van
        : balances.tin_dung;

    const diff = actualBalance - currentBal;
    if (diff === 0) {
      alert('Số dư thực tế đã hoàn toàn trùng khớp với sổ sách!');
      return;
    }

    const id = `tx_adj_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const adjTx: Transaction = {
      id,
      transactionDate: getTodayDateStr(),
      transactionType: 'BALANCE_ADJUSTMENT',
      amount: Math.abs(diff),
      currency: 'VND',
      description: `Điều chỉnh số dư ${accountId === 'tk_thang' ? 'TK Thắng' : accountId === 'tk_van' ? 'TK Vân' : 'Tín dụng'}: ${reason}`,
      note: `Chênh lệch: ${diff > 0 ? '+' : ''}${diff.toLocaleString('vi-VN')} ₫. Lý do: ${reason}`,
      sourceAccountId: diff < 0 ? accountId : undefined,
      destinationAccountId: diff > 0 ? accountId : undefined,
      memberId: accountId === 'tk_van' ? 'van' : 'thang',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      transactions: [adjTx, ...prev.transactions],
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          entityType: 'BALANCE_ADJUSTMENT',
          entityId: id,
          action: 'RECONCILE',
          description: `Đối soát số dư ${accountId}: điều chỉnh ${diff > 0 ? '+' : ''}${diff.toLocaleString('vi-VN')} ₫. Lý do: ${reason}`,
          userId: accountId === 'tk_van' ? 'van' : 'thang',
          timestamp: nowIso,
        },
        ...prev.auditLogs,
      ],
    }));

    alert(`Đã cân bằng số dư thành công! Đã ghi nhận giao dịch BALANCE_ADJUSTMENT.`);
  };

  // Handler: Add Savings Deposit
  const handleAddSavingsDeposit = (deposit: Omit<SavingsDeposit, 'id'>) => {
    const id = `sav_${Date.now()}`;
    const newDep: SavingsDeposit = { ...deposit, id };

    // Record SAVINGS_DEPOSIT transaction (Cash ↓, Savings Asset ↑, Expense = 0)
    const txId = `tx_sav_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const tx: Transaction = {
      id: txId,
      transactionDate: deposit.openedAt,
      transactionType: 'SAVINGS_DEPOSIT',
      amount: deposit.principal,
      currency: 'VND',
      description: `Mở sổ tiết kiệm: ${deposit.productName} (${deposit.provider})`,
      sourceAccountId: deposit.ownerMemberId === 'van' ? 'tk_van' : 'tk_thang',
      memberId: deposit.ownerMemberId || 'thang',
      savingsDepositId: id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      savingsDeposits: [newDep, ...prev.savingsDeposits],
      transactions: [tx, ...prev.transactions],
    }));
  };

  // Handler: Withdraw Savings
  const handleWithdrawSavings = (id: string, destinationAccountId: string) => {
    const dep = appState.savingsDeposits.find((s) => s.id === id);
    if (!dep) return;

    // Record SAVINGS_WITHDRAW transaction (Savings Asset ↓, Cash ↑, Income = 0)
    const txId = `tx_sav_wd_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const tx: Transaction = {
      id: txId,
      transactionDate: getTodayDateStr(),
      transactionType: 'SAVINGS_WITHDRAW',
      amount: dep.principal,
      currency: 'VND',
      description: `Tất toán sổ tiết kiệm: ${dep.productName}`,
      destinationAccountId,
      memberId: destinationAccountId === 'tk_van' ? 'van' : 'thang',
      savingsDepositId: id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      savingsDeposits: prev.savingsDeposits.map((s) =>
        s.id === id ? { ...s, status: 'WITHDRAWN' } : s
      ),
      transactions: [tx, ...prev.transactions],
    }));
  };

  // Handler: Collect Loan
  const handleCollectLoan = (
    loanId: string,
    amount: number,
    destinationAccountId: string
  ) => {
    const loan = appState.loans.find((l) => l.id === loanId);
    if (!loan) return;

    const remaining = Math.max(0, loan.outstandingPrincipal - amount);
    const newStatus = remaining === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Record COLLECT_LOAN transaction (Cash ↑, Receivable ↓, Income = 0)
    const txId = `tx_loan_cl_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const tx: Transaction = {
      id: txId,
      transactionDate: getTodayDateStr(),
      transactionType: 'COLLECT_LOAN',
      amount,
      currency: 'VND',
      description: `Thu hồi nợ từ ${loan.counterpartyId}`,
      destinationAccountId,
      memberId: destinationAccountId === 'tk_van' ? 'van' : 'thang',
      loanId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      loans: prev.loans.map((l) =>
        l.id === loanId
          ? { ...l, outstandingPrincipal: remaining, status: newStatus as any }
          : l
      ),
      transactions: [tx, ...prev.transactions],
    }));
  };

  // Handler: Add Loan
  const handleAddLoan = (loan: Omit<Loan, 'id' | 'createdAt'>) => {
    const id = `loan_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const created: Loan = { ...loan, id, createdAt: nowIso };

    // Record LEND transaction (Cash ↓, Receivable ↑, Expense = 0)
    const txId = `tx_lend_${Date.now()}`;
    const tx: Transaction = {
      id: txId,
      transactionDate: getTodayDateStr(),
      transactionType: loan.direction === 'RECEIVABLE' ? 'LEND' : 'BORROW',
      amount: loan.principal,
      currency: 'VND',
      description:
        loan.direction === 'RECEIVABLE'
          ? `Cho ${loan.counterpartyId} vay tiền`
          : `Vay tiền từ ${loan.counterpartyId}`,
      sourceAccountId: loan.direction === 'RECEIVABLE' ? 'tk_thang' : undefined,
      destinationAccountId: loan.direction === 'PAYABLE' ? 'tk_thang' : undefined,
      memberId: 'thang',
      loanId: id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setAppState((prev) => ({
      ...prev,
      loans: [created, ...prev.loans],
      transactions: [tx, ...prev.transactions],
    }));
  };

  // Handler: Confirm Recurring Transaction
  const handleConfirmRecurring = (rec: RecurringTransaction) => {
    handleSaveTransaction({
      transactionDate: getTodayDateStr(),
      transactionType: rec.type,
      amount: rec.amount,
      currency: 'VND',
      description: rec.title,
      categoryId: rec.categoryId,
      sourceAccountId: rec.type === 'EXPENSE' ? rec.accountId : undefined,
      destinationAccountId: rec.type === 'INCOME' ? rec.accountId : undefined,
      memberId: rec.memberId,
    });
    alert(`Đã ghi nhận giao dịch định kỳ "${rec.title}" vào sổ sách thành công!`);
  };

  const handleExportBackup = () => {
    exportAppStateAsJSON(appState);
  };

  const handleImportBackup = (jsonText: string) => {
    try {
      const loaded = importAppStateFromJSON(jsonText);
      setAppState(loaded);
      alert('Đã khôi phục dữ liệu sao lưu thành công!');
    } catch (err: any) {
      alert(`Lỗi nhập file: ${err.message}`);
    }
  };

  const handleResetData = () => {
    const empty = createEmptyAppState(appState.householdName);
    // Keep directory members from DB load so UI filters still work
    empty.members = appState.members;
    setAppState(empty);
    alert('Đã xóa dữ liệu tài chính trên cloud (giữ thành viên hộ).');
  };

  const unreadAlertsCount =
    (dailyAdvisor.status === 'DANGER' ? 1 : 0) +
    (balances.tin_dung > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white font-sans relative overflow-x-hidden">
      {saveError ? (
        <div className="relative z-50 bg-red-600 text-white text-sm px-4 py-2 text-center">
          Không lưu được lên cloud: {saveError}
        </div>
      ) : null}
      {/* Background Soft Subtle Ambient Gradient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/40 rounded-full filter blur-[100px]" />
        <div className="absolute top-1/4 -right-24 w-96 h-96 bg-purple-200/30 rounded-full filter blur-[120px]" />
        <div className="absolute top-2/3 left-10 w-80 h-80 bg-teal-100/40 rounded-full filter blur-[110px]" />
        <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-pink-100/30 rounded-full filter blur-[130px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-30">
        <Header
          householdName={appState.householdName}
          balances={balances}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onExportBackup={handleExportBackup}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 sm:pb-28">
        {activeTab === 'home' && (
          <HomeDashboard
            householdName={appState.householdName}
            currentMemberId={appState.currentMemberId}
            members={appState.members}
            balances={balances}
            monthlyStats={monthlyStats}
            dailyAdvisor={dailyAdvisor}
            recentTransactions={visibleTransactions}
            categories={appState.categories}
            creditCardConfig={appState.creditCardConfig}
            creditCardStatements={appState.creditCardStatements}
            savingsDeposits={appState.savingsDeposits}
            loans={appState.loans}
            funds={appState.funds}
            plannedExpenses={appState.plannedExpenses}
            recurringTransactions={appState.recurringTransactions}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionList
            transactions={appState.transactions}
            categories={appState.categories}
            members={appState.members}
            accounts={appState.accounts}
            events={appState.events}
            currentMemberId={appState.currentMemberId}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onSelectTransaction={(tx) => setSelectedTx(tx)}
          />
        )}

        {activeTab === 'plan' && (
          <PlanHub
            appState={appState}
            budgets={appState.budgets}
            incomePlans={appState.incomePlans}
            categories={appState.categories}
            transactions={appState.transactions}
            funds={appState.funds}
            plannedExpenses={appState.plannedExpenses}
            goals={appState.goals}
            events={appState.events}
            eventItems={appState.eventItems}
            eventContributions={appState.eventContributions}
            recurringTransactions={appState.recurringTransactions}
            members={appState.members}
            accounts={appState.accounts}
            totalCash={balances.totalCash}
            onApplyPlanState={(partial) =>
              setAppState((p) => ({
                ...p,
                ...partial,
              }))
            }
            onUpdateBudget={(b) =>
              setAppState((p) => ({
                ...p,
                budgets: p.budgets.map((item) => (item.id === b.id ? b : item)),
              }))
            }
            onAddBudget={(b) =>
              setAppState((p) => ({
                ...p,
                budgets: [
                  ...p.budgets.filter(
                    (item) => !(item.categoryId === b.categoryId && item.month === b.month)
                  ),
                  { ...b, id: `b_${Date.now()}` },
                ],
              }))
            }
            onDeleteBudget={(id) =>
              setAppState((p) => ({
                ...p,
                budgets: p.budgets.filter((item) => item.id !== id),
              }))
            }
            onUpdateIncomePlan={(ip) =>
              setAppState((p) => ({
                ...p,
                incomePlans: p.incomePlans.map((item) => (item.id === ip.id ? ip : item)),
              }))
            }
            onAddIncomePlan={(ip) =>
              setAppState((p) => ({
                ...p,
                incomePlans: [...p.incomePlans, { ...ip, id: `ip_${Date.now()}` }],
              }))
            }
            onDeleteIncomePlan={(id) =>
              setAppState((p) => ({
                ...p,
                incomePlans: p.incomePlans.filter((item) => item.id !== id),
              }))
            }
            onAddFund={(f) =>
              setAppState((p) => ({
                ...p,
                funds: [...p.funds, { ...f, id: `fund_${Date.now()}` }],
              }))
            }
            onUpdateFund={(f) =>
              setAppState((p) => ({
                ...p,
                funds: p.funds.map((item) => (item.id === f.id ? f : item)),
              }))
            }
            onAddPlannedExpense={(pe) =>
              setAppState((p) => ({
                ...p,
                plannedExpenses: [...p.plannedExpenses, { ...pe, id: `pe_${Date.now()}` }],
              }))
            }
            onUpdatePlannedExpense={(pe) =>
              setAppState((p) => ({
                ...p,
                plannedExpenses: p.plannedExpenses.map((item) => (item.id === pe.id ? pe : item)),
              }))
            }
            onAddGoal={(g) =>
              setAppState((p) => ({
                ...p,
                goals: [...p.goals, { ...g, id: `goal_${Date.now()}` }],
              }))
            }
            onUpdateGoal={(g) =>
              setAppState((p) => ({
                ...p,
                goals: p.goals.map((item) => (item.id === g.id ? g : item)),
              }))
            }
            onAddEvent={(ev) =>
              setAppState((p) => ({
                ...p,
                events: [...p.events, { ...ev, id: `ev_${Date.now()}` }],
              }))
            }
            onConfirmRecurring={handleConfirmRecurring}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            transactions={appState.transactions}
            categories={appState.categories}
            budgets={appState.budgets}
            accounts={appState.accounts}
            savingsDeposits={appState.savingsDeposits}
            loans={appState.loans}
            funds={appState.funds}
            members={appState.members}
            balances={balances}
          />
        )}

        {activeTab === 'more' && (
          <MoreHub
            accounts={appState.accounts}
            balances={balances}
            creditCardConfig={appState.creditCardConfig}
            creditCardStatements={appState.creditCardStatements}
            installmentPlans={appState.installmentPlans}
            savingsDeposits={appState.savingsDeposits}
            loans={appState.loans}
            counterparties={appState.counterparties}
            suggestionRules={appState.suggestionRules}
            categories={appState.categories}
            auditLogs={appState.auditLogs}
            members={appState.members}
            onReconcileAccount={handleReconcileAccount}
            onAddSavingsDeposit={handleAddSavingsDeposit}
            onWithdrawSavings={handleWithdrawSavings}
            onCollectLoan={handleCollectLoan}
            onAddLoan={handleAddLoan}
            onAddSuggestionRule={(rule) =>
              setAppState((p) => ({
                ...p,
                suggestionRules: [
                  ...p.suggestionRules,
                  { ...rule, id: `rule_${Date.now()}` },
                ],
              }))
            }
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Quick Transaction Entry Modal (< 10 seconds) */}
      <QuickTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={appState.categories}
        accounts={appState.accounts}
        members={appState.members}
        rules={appState.suggestionRules}
        events={appState.events}
        funds={appState.funds}
        counterparties={appState.counterparties}
        currentMemberId={appState.currentMemberId}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Transaction Detail / Edit / Delete Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        categories={appState.categories}
        accounts={appState.accounts}
        members={appState.members}
        events={appState.events}
        funds={appState.funds}
        counterparties={appState.counterparties}
        onUpdateTransaction={handleUpdateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onDuplicateTransaction={handleDuplicateTransaction}
      />

      {/* Notification / Alert Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        dailyAdvisor={dailyAdvisor}
        creditCardConfig={appState.creditCardConfig}
        savingsDeposits={appState.savingsDeposits}
        loans={appState.loans}
        funds={appState.funds}
        plannedExpenses={appState.plannedExpenses}
      />
    </div>
  );
}
