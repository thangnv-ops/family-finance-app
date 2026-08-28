import React, { useState, useMemo } from 'react';
import {
  Transaction,
  Category,
  Member,
  FinancialAccount,
  EventBudget,
  TransactionType,
} from '../../types/finance';
import { formatVND, formatDateVN, formatMonthVN, getCurrentMonthStr } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { transactionCategoryId } from '../../lib/ledger';
import {
  Search,
  Filter,
  Calendar,
  Plus,
  ArrowUpDown,
  Download,
  Trash2,
  Edit3,
  Copy,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  members: Member[];
  accounts: FinancialAccount[];
  events: EventBudget[];
  currentMemberId: string;
  onOpenQuickAdd: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  members,
  accounts,
  events,
  currentMemberId,
  onOpenQuickAdd,
  onSelectTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [selectedMember, setSelectedMember] = useState<string>(currentMemberId);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Extract unique available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getCurrentMonthStr());
    transactions.forEach((tx) => {
      if (tx.transactionDate) {
        months.add(tx.transactionDate.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.deletedAt) return false;

      // Month filter
      if (selectedMonth !== 'ALL' && !tx.transactionDate.startsWith(selectedMonth)) {
        return false;
      }

      // Member filter
      if (selectedMember !== 'all' && tx.memberId !== selectedMember) {
        return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && tx.transactionType !== selectedType) {
        return false;
      }

      // Category filter
      const effectiveCategoryId = transactionCategoryId(tx.transactionType, tx.categoryId);
      if (selectedCategoryId !== 'ALL' && effectiveCategoryId !== selectedCategoryId) {
        return false;
      }

      // Account filter
      if (selectedAccountId !== 'ALL') {
        if (tx.sourceAccountId !== selectedAccountId && tx.destinationAccountId !== selectedAccountId) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const catName = effectiveCategoryId
          ? categoryMap.get(effectiveCategoryId)?.name.toLowerCase() || ''
          : '';
        const matchDesc = tx.description.toLowerCase().includes(query);
        const matchNote = tx.note ? tx.note.toLowerCase().includes(query) : false;
        const matchCat = catName.includes(query);
        if (!matchDesc && !matchNote && !matchCat) return false;
      }

      return true;
    });
  }, [
    transactions,
    selectedMonth,
    selectedMember,
    selectedType,
    selectedCategoryId,
    selectedAccountId,
    searchTerm,
    categoryMap,
  ]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const date = tx.transactionDate;
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Filtered totals
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((tx) => {
      if (tx.transactionType === 'INCOME') income += tx.amount;
      else if (
        tx.transactionType === 'EXPENSE' ||
        tx.transactionType === 'CREDIT_PURCHASE'
      )
        expense += tx.amount;
      else if (tx.transactionType === 'REFUND' || tx.transactionType === 'CREDIT_REFUND')
        expense -= tx.amount;
    });
    return { income, expense, count: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Sổ chi tiêu & giao dịch</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-semibold">
              {totals.count} giao dịch
            </span>
          </h2>
          <p className="text-xs text-slate-500">Xem và lọc toàn bộ lịch sử thu/chi, chuyển khoản, thẻ tín dụng</p>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="self-start sm:self-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nhập giao dịch</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-3 shadow-sm">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo nội dung, danh mục, ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Month */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả thời gian</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthVN(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Member */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Thành viên</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Toàn gia đình</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Loại GD</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="EXPENSE">Chi tiền (Tiền mặt/TK)</option>
              <option value="INCOME">Thu nhập</option>
              <option value="TRANSFER">Chuyển khoản nội bộ</option>
              <option value="CREDIT_PURCHASE">Chi qua Thẻ Tín dụng</option>
              <option value="CREDIT_PAYMENT">Thanh toán nợ thẻ</option>
              <option value="SAVINGS_DEPOSIT">Gửi Tiết kiệm</option>
              <option value="LEND">Cho vay</option>
              <option value="COLLECT_LOAN">Thu hồi nợ</option>
              <option value="BORROW">Đi vay</option>
              <option value="BALANCE_ADJUSTMENT">Điều chỉnh số dư</option>
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Tài khoản</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả tài khoản</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Strip */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
          <span className="text-slate-500">
            Tổng thu lọc: <strong className="text-emerald-600">+{formatVND(totals.income)}</strong>
          </span>
          <span className="text-slate-500">
            Tổng chi lọc: <strong className="text-rose-600">-{formatVND(totals.expense)}</strong>
          </span>
        </div>
      </div>

      {/* Transaction List Grouped by Date */}
      <div className="space-y-3">
        {grouped.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-500 text-xs shadow-sm">
            Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          grouped.map(([date, txList]) => {
            const dayExpense = txList
              .filter((t) => t.transactionType === 'EXPENSE' || t.transactionType === 'CREDIT_PURCHASE')
              .reduce((sum, t) => sum + t.amount, 0);

            const dayIncome = txList
              .filter((t) => t.transactionType === 'INCOME')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div
                key={date}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Date Header */}
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formatDateVN(date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    {dayIncome > 0 && <span className="text-emerald-600">+{formatVND(dayIncome)}</span>}
                    {dayExpense > 0 && <span className="text-rose-600">-{formatVND(dayExpense)}</span>}
                  </div>
                </div>

                {/* Items in this date */}
                <div className="divide-y divide-slate-100">
                  {txList.map((tx) => {
                    const effectiveCategoryId = transactionCategoryId(
                      tx.transactionType,
                      tx.categoryId
                    );
                    const cat = effectiveCategoryId
                      ? categoryMap.get(effectiveCategoryId)
                      : undefined;
                    const isIncome = tx.transactionType === 'INCOME';
                    const isTransfer = tx.transactionType === 'TRANSFER';
                    const isCredit = tx.transactionType === 'CREDIT_PURCHASE';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => onSelectTransaction(tx)}
                        className="p-3 sm:p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200"
                            style={{
                              backgroundColor: cat?.color ? `${cat.color}15` : '#3b82f615',
                              color: cat?.color || '#4f46e5',
                            }}
                          >
                            <CategoryIcon iconName={cat?.icon || 'Tag'} className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {tx.description}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="capitalize">
                                {isTransfer ? 'Chuyển khoản nội bộ' : cat?.name || 'Khác'}
                              </span>
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
                              {tx.note && (
                                <>
                                  <span>&middot;</span>
                                  <span className="truncate italic text-slate-500 max-w-[120px]">
                                    {tx.note}
                                  </span>
                                </>
                              )}
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
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
