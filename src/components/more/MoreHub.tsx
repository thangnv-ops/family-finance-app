import React, { useState } from 'react';
import {
  FinancialAccount,
  CreditCardConfig,
  CreditCardStatement,
  InstallmentPlan,
  SavingsDeposit,
  Loan,
  Counterparty,
  SuggestionRule,
  Category,
  AuditLog,
  Transaction,
  Member,
} from '../../types/finance';
import { AccountBalances } from '../../lib/ledger';
import { formatVND, formatDateVN, getTodayDateStr } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  HeartHandshake,
  Sparkles,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  ChevronRight,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MoreHubProps {
  accounts: FinancialAccount[];
  balances: AccountBalances;
  creditCardConfig: CreditCardConfig;
  creditCardStatements: CreditCardStatement[];
  installmentPlans: InstallmentPlan[];
  savingsDeposits: SavingsDeposit[];
  loans: Loan[];
  counterparties: Counterparty[];
  suggestionRules: SuggestionRule[];
  categories: Category[];
  auditLogs: AuditLog[];
  members: Member[];
  onReconcileAccount: (accountId: string, actualBalance: number, reason: string) => void;
  onAddSavingsDeposit: (deposit: Omit<SavingsDeposit, 'id'>) => void;
  onWithdrawSavings: (id: string, destinationAccountId: string) => void;
  onCollectLoan: (loanId: string, amount: number, destinationAccountId: string) => void;
  onAddLoan: (loan: Omit<Loan, 'id' | 'createdAt'>) => void;
  onAddSuggestionRule: (rule: Omit<SuggestionRule, 'id'>) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonText: string) => void;
  onResetData: () => void;
}

export const MoreHub: React.FC<MoreHubProps> = ({
  accounts,
  balances,
  creditCardConfig,
  creditCardStatements,
  installmentPlans,
  savingsDeposits,
  loans,
  counterparties,
  suggestionRules,
  categories,
  auditLogs,
  members,
  onReconcileAccount,
  onAddSavingsDeposit,
  onWithdrawSavings,
  onCollectLoan,
  onAddLoan,
  onAddSuggestionRule,
  onExportBackup,
  onImportBackup,
  onResetData,
}) => {
  const [activeSection, setActiveSection] = useState<
    'accounts' | 'credit' | 'savings' | 'loans' | 'rules' | 'backup'
  >('accounts');

  // Reconciliation modal state
  const [reconcileAccount, setReconcileAccount] = useState<FinancialAccount | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');
  const [reconcileReason, setReconcileReason] = useState<string>('');

  // Add Savings Modal state
  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
  const [savingsProvider, setSavingsProvider] = useState('Techcombank');
  const [savingsProduct, setSavingsProduct] = useState('Tiết kiệm Online');
  const [savingsPrincipal, setSavingsPrincipal] = useState('50000000');
  const [savingsRate, setSavingsRate] = useState('5.8');
  const [savingsMonths, setSavingsMonths] = useState('6');
  const [savingsOwner, setSavingsOwner] = useState('thang');

  // Add Loan Modal state
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanDirection, setLoanDirection] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [loanAmount, setLoanAmount] = useState('5000000');
  const [loanDueDate, setLoanDueDate] = useState('');
  const [loanNote, setLoanNote] = useState('');

  // Add Rule Modal state
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleType, setNewRuleType] = useState<any>('EXPENSE');
  const [newRuleCategory, setNewRuleCategory] = useState('');

  const handleOpenReconcile = (acc: FinancialAccount) => {
    setReconcileAccount(acc);
    const currentBal =
      acc.id === 'tk_thang'
        ? balances.tk_thang
        : acc.id === 'tk_van'
        ? balances.tk_van
        : balances.tin_dung;
    setActualBalanceInput(String(currentBal));
    setReconcileReason('Đối soát số dư thực tế theo App ngân hàng');
  };

  const handleConfirmReconcile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileAccount) return;
    const actual = parseInt(actualBalanceInput.replace(/[^0-9-]/g, ''), 10);
    if (isNaN(actual)) {
      alert('Vui lòng nhập số dư thực tế hợp lệ.');
      return;
    }
    if (!reconcileReason.trim()) {
      alert('Bắt buộc phải nhập lý do điều chỉnh số dư.');
      return;
    }

    onReconcileAccount(reconcileAccount.id, actual, reconcileReason.trim());
    setReconcileAccount(null);
  };

  const handleCreateSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseInt(savingsPrincipal.replace(/[^0-9]/g, ''), 10) || 10_000_000;
    const rate = parseFloat(savingsRate) || 5.0;
    const months = parseInt(savingsMonths, 10) || 6;
    const expectedInterest = Math.round((principal * (rate / 100) * months) / 12);

    const now = new Date();
    const matDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
    const matStr = matDate.toISOString().split('T')[0];

    onAddSavingsDeposit({
      provider: savingsProvider,
      productName: savingsProduct,
      ownerMemberId: savingsOwner,
      openedAt: getTodayDateStr(),
      principal,
      annualInterestRate: rate,
      termMonths: months,
      maturityDate: matStr,
      expectedInterest,
      expectedMaturityAmount: principal + expectedInterest,
      autoRenew: true,
      status: 'ACTIVE',
      note: `Gửi tiết kiệm ${months} tháng`,
    });

    setShowAddSavingsModal(false);
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanName.trim()) return;
    const principal = parseInt(loanAmount.replace(/[^0-9]/g, ''), 10) || 1_000_000;

    onAddLoan({
      counterpartyId: loanName.trim(),
      direction: loanDirection,
      principal,
      outstandingPrincipal: principal,
      expectedDueDate: loanDueDate || undefined,
      status: 'ACTIVE',
      note: loanNote.trim() || undefined,
    });

    setLoanName('');
    setLoanDueDate('');
    setLoanNote('');
    setShowAddLoanModal(false);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleKeyword.trim()) return;

    onAddSuggestionRule({
      keyword: newRuleKeyword.trim().toLowerCase(),
      matchType: 'CONTAINS',
      suggestedTransactionType: newRuleType,
      suggestedCategoryId: newRuleCategory || undefined,
      priority: 5,
      isActive: true,
    });

    setNewRuleKeyword('');
    setShowAddRuleModal(false);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm text-xs">
        <button
          onClick={() => setActiveSection('accounts')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'accounts'
              ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tài khoản & Đối soát</span>
        </button>

        <button
          onClick={() => setActiveSection('credit')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'credit'
              ? 'bg-amber-50 text-amber-800 shadow-xs border border-amber-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          <span>Thẻ Tín dụng</span>
        </button>

        <button
          onClick={() => setActiveSection('savings')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'savings'
              ? 'bg-purple-50 text-purple-800 shadow-xs border border-purple-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5 text-purple-600" />
          <span>Sổ Tiết kiệm ({savingsDeposits.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('loans')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'loans'
              ? 'bg-cyan-50 text-cyan-800 shadow-xs border border-cyan-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-cyan-600" />
          <span>Sổ Vay nợ ({loans.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('rules')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'rules'
              ? 'bg-pink-50 text-pink-800 shadow-xs border border-pink-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-600" />
          <span>Luật gợi ý ({suggestionRules.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('backup')}
          className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'backup'
              ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sao lưu & Nhật ký</span>
        </button>
      </div>

      {/* 1. ACCOUNTS & RECONCILIATION */}
      {activeSection === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <span>3 Tài khoản tài chính cốt lõi (Locked Model)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mô hình chuẩn hóa: TK Thắng, TK Vân và Tín dụng. Định kỳ đối soát với số dư thực tế.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {accounts.map((acc) => {
                const currentBal =
                  acc.id === 'tk_thang'
                    ? balances.tk_thang
                    : acc.id === 'tk_van'
                    ? balances.tk_van
                    : balances.tin_dung;

                const isCredit = acc.type === 'CREDIT_LIABILITY';

                return (
                  <div
                    key={acc.id}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{acc.name}</span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          isCredit
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isCredit ? 'Nợ phải trả' : 'Tiền mặt khả dụng'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                        {isCredit ? 'Dư nợ hiện tại' : 'Số dư hiện tại trên sổ'}
                      </span>
                      <div
                        className={`text-xl sm:text-2xl font-black ${
                          isCredit ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatVND(currentBal)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenReconcile(acc)}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cân bằng / Đối soát số dư</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. CREDIT CARDS */}
      {activeSection === 'credit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <span>{creditCardConfig.cardName}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  {creditCardConfig.bank} &middot; Đuôi thẻ: {creditCardConfig.last4Digits} &middot; Trạng thái: {creditCardConfig.status}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Hạn mức tín dụng
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {formatVND(creditCardConfig.creditLimit)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Dư nợ kỳ hiện tại</span>
                <span className="font-extrabold text-amber-600 text-sm">
                  {formatVND(balances.tin_dung)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Hạn mức khả dụng</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  {formatVND(creditCardConfig.creditLimit - balances.tin_dung)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Ngày chốt sao kê</span>
                <span className="font-bold text-slate-800">Ngày {creditCardConfig.statementDay} hàng tháng</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Hạn thanh toán</span>
                <span className="font-bold text-slate-800">Ngày {creditCardConfig.dueDay} hàng tháng</span>
              </div>
            </div>

            {/* Installment Plans (Section 20) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700">Trả góp 0% / Kỳ hạn đang hoạt động:</h4>
              {installmentPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block">{plan.title}</span>
                    <span className="text-[11px] text-slate-500">
                      Gốc: {formatVND(plan.principal)} &middot; Tiến độ: {plan.paidMonths}/{plan.months} tháng &middot; Trả mỗi tháng:{' '}
                      <strong className="text-slate-900">{formatVND(plan.monthlyPayment)}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Gốc còn lại</span>
                    <span className="font-extrabold text-amber-600">
                      {formatVND(plan.remainingPrincipal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SAVINGS & TERM DEPOSITS */}
      {activeSection === 'savings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sổ Tiết kiệm & Tiền gửi có kỳ hạn</h3>
              <p className="text-xs text-slate-500">
                Được quản lý như tài sản riêng biệt, không bị nhầm lẫn là chi tiêu
              </p>
            </div>
            <button
              onClick={() => setShowAddSavingsModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gửi thêm sổ mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {savingsDeposits.map((dep) => (
              <div
                key={dep.id}
                className="bg-white border border-slate-200 p-4 rounded-3xl space-y-3 shadow-sm text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-200">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{dep.productName}</h4>
                      <span className="text-[11px] text-slate-500">{dep.provider}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {dep.annualInterestRate}% / năm
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tiền gốc:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{formatVND(dep.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày đáo hạn:</span>
                    <span className="font-bold text-purple-700">{formatDateVN(dep.maturityDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lãi dự kiến cuối kỳ:</span>
                    <span className="font-bold text-emerald-600">+{formatVND(dep.expectedInterest)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có muốn tất toán sổ tiết kiệm ${dep.productName} về TK Thắng?`)) {
                        onWithdrawSavings(dep.id, 'tk_thang');
                      }
                    }}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Tất toán về TK Thắng
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có muốn tất toán sổ tiết kiệm ${dep.productName} về TK Vân?`)) {
                        onWithdrawSavings(dep.id, 'tk_van');
                      }
                    }}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Tất toán về TK Vân
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LOANS & LENDING */}
      {activeSection === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sổ Vay nợ cá nhân & Bạn bè</h3>
              <p className="text-xs text-slate-500">
                Cho vay (Khoản phải thu) và Đi vay (Khoản phải trả)
              </p>
            </div>
            <button
              onClick={() => setShowAddLoanModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ghi nhận khoản vay mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {loans.map((loan) => {
              const isReceivable = loan.direction === 'RECEIVABLE';

              return (
                <div
                  key={loan.id}
                  className="bg-white border border-slate-200 p-4 rounded-3xl space-y-3 shadow-sm text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border border-slate-200 ${
                          isReceivable
                            ? 'bg-cyan-50 text-cyan-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {loan.counterpartyId}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {isReceivable ? 'Cho vay (Khoản phải thu)' : 'Đi vay (Khoản phải trả)'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        isReceivable
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gốc ban đầu:</span>
                      <span className="font-bold text-slate-900">{formatVND(loan.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số tiền còn lại:</span>
                      <span className="font-extrabold text-cyan-700 text-sm">
                        {formatVND(loan.outstandingPrincipal)}
                      </span>
                    </div>
                    {loan.expectedDueDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hạn dự kiến:</span>
                        <span className="font-medium text-slate-800">
                          {formatDateVN(loan.expectedDueDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {isReceivable && loan.outstandingPrincipal > 0 && (
                    <button
                      onClick={() => {
                        const amtStr = prompt(
                          `Nhập số tiền thu hồi từ ${loan.counterpartyId} (tối đa ${loan.outstandingPrincipal}):`,
                          String(loan.outstandingPrincipal)
                        );
                        if (amtStr) {
                          const amt = parseInt(amtStr.replace(/[^0-9]/g, ''), 10);
                          if (amt > 0) {
                            onCollectLoan(loan.id, amt, 'tk_thang');
                          }
                        }
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Thu hồi nợ (Ghi nhận tiền vào)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. SUGGESTION RULES & CATEGORIES */}
      {activeSection === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Luật gợi ý từ khóa (Map Danh Mục)</h3>
              <p className="text-xs text-slate-500">
                Tự động điền loại giao dịch, danh mục, tài khoản khi gõ nội dung
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm luật mới</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-100 shadow-sm">
            {suggestionRules.map((rule) => {
              const cat = categories.find((c) => c.id === rule.suggestedCategoryId);
              return (
                <div
                  key={rule.id}
                  className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      "{rule.keyword}"
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className="font-semibold text-emerald-600">
                      {rule.suggestedTransactionType}
                    </span>
                    {cat && (
                      <span className="text-slate-600 flex items-center gap-1">
                        &middot; {cat.name}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Ưu tiên: {rule.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. BACKUP & AUDIT LOG */}
      {activeSection === 'backup' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Sao lưu & Phục hồi dữ liệu (Backup Engine)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Dữ liệu của Thắng & Vân được lưu trữ an toàn trong trình duyệt. Bạn có thể xuất file JSON để lưu về máy tính/Google Drive bất cứ lúc nào.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={onExportBackup}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất file sao lưu (Export JSON)</span>
              </button>

              <label className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all border border-slate-300 shadow-xs">
                <Upload className="w-4 h-4" />
                <span>Nhập từ file sao lưu (Import JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) {
                          onImportBackup(content);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>

              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu về trạng thái mẫu ban đầu?')) {
                    onResetData();
                  }
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all ml-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Khôi phục dữ liệu gốc</span>
              </button>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span>Nhật ký kiểm toán hệ thống (Audit Logs - Section 39)</span>
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">{log.description}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('vi-VN')} &middot; Thực hiện: {log.userId}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reconciliation */}
      {reconcileAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmReconcile}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 space-y-4 text-xs shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-bold text-base text-slate-900">
                Đối soát số dư: {reconcileAccount.name}
              </h4>
              <button
                type="button"
                onClick={() => setReconcileAccount(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Số dư trên sổ App hiện tại:</span>
                <span className="font-bold text-slate-900">
                  {formatVND(
                    reconcileAccount.id === 'tk_thang'
                      ? balances.tk_thang
                      : reconcileAccount.id === 'tk_van'
                      ? balances.tk_van
                      : balances.tin_dung
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">
                Số dư thực tế trong tài khoản ngân hàng (VND):
              </label>
              <input
                type="text"
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value.replace(/[^0-9-]/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-extrabold text-emerald-600 focus:outline-none focus:border-indigo-500 focus:bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">
                Lý do điều chỉnh (Bắt buộc theo chuẩn kế toán):
              </label>
              <input
                type="text"
                placeholder="VD: Khớp số dư ngày 24/08/2026..."
                value={reconcileReason}
                onChange={(e) => setReconcileReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReconcileAccount(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Ghi nhận điều chỉnh</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Savings */}
      {showAddSavingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateSavings}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <h4 className="font-bold text-base text-slate-900">Mở sổ tiết kiệm mới</h4>
            <div>
              <label className="block text-slate-600 mb-1">Ngân hàng / Đơn vị</label>
              <input
                type="text"
                value={savingsProvider}
                onChange={(e) => setSavingsProvider(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Tên sản phẩm tiết kiệm</label>
              <input
                type="text"
                value={savingsProduct}
                onChange={(e) => setSavingsProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Số tiền gửi (VND)</label>
                <input
                  type="text"
                  value={savingsPrincipal}
                  onChange={(e) => setSavingsPrincipal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Lãi suất (% / năm)</label>
                <input
                  type="text"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Kỳ hạn (Tháng)</label>
                <select
                  value={savingsMonths}
                  onChange={(e) => setSavingsMonths(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value="1">1 Tháng</option>
                  <option value="3">3 Tháng</option>
                  <option value="6">6 Tháng</option>
                  <option value="12">12 Tháng</option>
                  <option value="24">24 Tháng</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Người đứng tên</label>
                <select
                  value={savingsOwner}
                  onChange={(e) => setSavingsOwner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value="thang">Thắng</option>
                  <option value="van">Vân</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSavingsModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Lưu sổ tiết kiệm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Loan */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateLoan}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <h4 className="font-bold text-base text-slate-900">Ghi nhận khoản vay mượn</h4>
            <div>
              <label className="block text-slate-600 mb-1">Tên người vay / cho vay</label>
              <input
                type="text"
                placeholder="VD: Bạn Nam, Anh Tuấn..."
                value={loanName}
                onChange={(e) => setLoanName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 mb-1">Hình thức</label>
                <select
                  value={loanDirection}
                  onChange={(e) => setLoanDirection(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="RECEIVABLE">Cho vay (Khoản phải thu)</option>
                  <option value="PAYABLE">Đi vay (Khoản phải trả)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Số tiền (VND)</label>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Hạn trả dự kiến</label>
              <input
                type="date"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Ghi chú</label>
              <input
                type="text"
                placeholder="Mục đích mượn tiền..."
                value={loanNote}
                onChange={(e) => setLoanNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLoanModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Lưu khoản vay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreateRule}
            className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 text-xs shadow-xl"
          >
            <h4 className="font-bold text-base text-slate-900">Thêm luật gợi ý từ khóa</h4>
            <div>
              <label className="block text-slate-600 mb-1">Từ khóa (Keyword)</label>
              <input
                type="text"
                placeholder="VD: grab, highlands, shopee..."
                value={newRuleKeyword}
                onChange={(e) => setNewRuleKeyword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Loại giao dịch gợi ý</label>
              <select
                value={newRuleType}
                onChange={(e) => setNewRuleType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              >
                <option value="EXPENSE">Chi tiền (EXPENSE)</option>
                <option value="CREDIT_PURCHASE">Chi qua thẻ tín dụng</option>
                <option value="INCOME">Thu nhập (INCOME)</option>
                <option value="TRANSFER">Chuyển khoản (TRANSFER)</option>
                <option value="CREDIT_PAYMENT">Trả nợ thẻ tín dụng</option>
                <option value="REFUND">Hoàn tiền (REFUND)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Danh mục gợi ý</label>
              <select
                value={newRuleCategory}
                onChange={(e) => setNewRuleCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              >
                <option value="">-- Không chỉ định --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Lưu luật gợi ý
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
