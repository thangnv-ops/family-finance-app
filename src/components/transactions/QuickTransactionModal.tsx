import React, { useState, useEffect } from 'react';
import {
  Category,
  FinancialAccount,
  Member,
  Transaction,
  TransactionType,
  SuggestionRule,
  EventBudget,
  Fund,
  Counterparty,
} from '../../types/finance';
import { evaluateDescription } from '../../lib/suggestions';
import { getTodayDateStr, formatVND } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  Users,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  MapPin,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: FinancialAccount[];
  members: Member[];
  rules: SuggestionRule[];
  events: EventBudget[];
  funds: Fund[];
  counterparties: Counterparty[];
  currentMemberId: string;
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  members,
  rules,
  events,
  funds,
  counterparties,
  currentMemberId,
  onSaveTransaction,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sourceAccountId, setSourceAccountId] = useState<string>('tk_thang');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [memberId, setMemberId] = useState<string>(currentMemberId === 'van' ? 'van' : 'thang');
  const [transactionDate, setTransactionDate] = useState<string>(getTodayDateStr());
  const [note, setNote] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [fundId, setFundId] = useState<string>('');
  const [counterpartyId, setCounterpartyId] = useState<string>('');
  const [showMore, setShowMore] = useState<boolean>(false);
  const [matchedSuggestion, setMatchedSuggestion] = useState<string | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setDescription('');
      setTransactionType('EXPENSE');
      setCategoryId(categories.find((c) => c.kind === 'EXPENSE')?.id || '');
      setSourceAccountId(currentMemberId === 'van' ? 'tk_van' : 'tk_thang');
      setDestinationAccountId('');
      setMemberId(currentMemberId === 'van' ? 'van' : 'thang');
      setTransactionDate(getTodayDateStr());
      setNote('');
      setEventId('');
      setFundId('');
      setCounterpartyId('');
      setShowMore(false);
      setMatchedSuggestion(null);
    }
  }, [isOpen, currentMemberId, categories]);

  // Real-time keyword auto-suggest as user types description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);

    const match = evaluateDescription(val, rules, memberId);
    if (match) {
      setMatchedSuggestion(match.matchedKeyword || 'Tự động nhận diện');
      if (match.transactionType) setTransactionType(match.transactionType);
      if (match.categoryId) setCategoryId(match.categoryId);
      if (match.sourceAccountId) setSourceAccountId(match.sourceAccountId);
      if (match.destinationAccountId) setDestinationAccountId(match.destinationAccountId);
      if (match.memberId) setMemberId(match.memberId);
    } else {
      setMatchedSuggestion(null);
    }
  };

  const parseAmount = (): number => {
    const cleaned = amountStr.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  };

  const handleAddQuickAmount = (val: number) => {
    const current = parseAmount();
    setAmountStr(String(current + val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseAmount();
    if (parsedAmt <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }
    if (!description.trim()) {
      alert('Vui lòng nhập nội dung chi tiêu.');
      return;
    }

    onSaveTransaction({
      transactionDate,
      transactionType,
      amount: parsedAmt,
      currency: 'VND',
      description: description.trim(),
      note: note.trim() || undefined,
      categoryId: categoryId || undefined,
      sourceAccountId:
        transactionType === 'INCOME'
          ? undefined
          : transactionType === 'CREDIT_PURCHASE'
          ? 'tin_dung'
          : sourceAccountId,
      destinationAccountId:
        transactionType === 'INCOME'
          ? destinationAccountId || (memberId === 'van' ? 'tk_van' : 'tk_thang')
          : transactionType === 'TRANSFER' || transactionType === 'CREDIT_PAYMENT'
          ? destinationAccountId
          : undefined,
      memberId,
      eventId: eventId || undefined,
      fundId: fundId || undefined,
      counterpartyId: counterpartyId || undefined,
    });

    if (transactionType === 'SAVINGS_DEPOSIT' || transactionType === 'INCOME') {
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      } catch {
        // ignore
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  const currentAmount = parseAmount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-950/85 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.7)] text-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-400/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Ghi chép giao dịch nhanh</h2>
              <p className="text-xs text-slate-400">Nhập dưới 10 giây &middot; Tự động định loại</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Transaction Type Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                setTransactionType('EXPENSE');
                setSourceAccountId(memberId === 'van' ? 'tk_van' : 'tk_thang');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                transactionType === 'EXPENSE'
                  ? 'bg-rose-500/90 text-white shadow-lg border border-rose-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Chi tiền</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('INCOME');
                setDestinationAccountId(memberId === 'van' ? 'tk_van' : 'tk_thang');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                transactionType === 'INCOME'
                  ? 'bg-emerald-500/90 text-white shadow-lg border border-emerald-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Thu nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('TRANSFER');
                setSourceAccountId('tk_thang');
                setDestinationAccountId('tk_van');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                transactionType === 'TRANSFER'
                  ? 'bg-indigo-500/90 text-white shadow-lg border border-indigo-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Chuyển tiền</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTransactionType('CREDIT_PURCHASE');
                setSourceAccountId('tin_dung');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-0.5 ${
                transactionType === 'CREDIT_PURCHASE'
                  ? 'bg-amber-500/90 text-white shadow-lg border border-amber-400/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Thẻ TD</span>
            </button>
          </div>

          {/* Amount Input with big readable display */}
          <div className="bg-black/40 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Số tiền (VND)</span>
              {currentAmount > 0 && (
                <span className="font-semibold text-emerald-400">
                  {formatVND(currentAmount)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-400">₫</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amountStr ? Number(amountStr).toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(raw);
                }}
                className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-white focus:outline-none placeholder-slate-600"
                autoFocus
              />
            </div>

            {/* Quick addition pill buttons */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/10 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => handleAddQuickAmount(50_000)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-slate-300 font-medium whitespace-nowrap border border-white/10"
              >
                +50k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickAmount(100_000)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-slate-300 font-medium whitespace-nowrap border border-white/10"
              >
                +100k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickAmount(200_000)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-slate-300 font-medium whitespace-nowrap border border-white/10"
              >
                +200k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickAmount(500_000)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-slate-300 font-medium whitespace-nowrap border border-white/10"
              >
                +500k
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickAmount(1_000_000)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/15 text-slate-300 font-medium whitespace-nowrap border border-white/10"
              >
                +1Tr
              </button>
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-medium ml-auto border border-white/10"
              >
                Xóa
              </button>
            </div>
          </div>

          {/* Description with Smart Suggestion */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Nội dung giao dịch</span>
              {matchedSuggestion && (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-400/20 backdrop-blur-md">
                  <Sparkles className="w-3 h-3" />
                  Khớp: "{matchedSuggestion}"
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="VD: Ăn trưa Highlands, Đổ xăng, Mua đồ shopee, Lương..."
              value={description}
              onChange={handleDescriptionChange}
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/30 transition-colors"
            />
          </div>

          {/* Account & Category (or Destination Account for Transfer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">
                {transactionType === 'TRANSFER' ? 'Từ tài khoản' : 'Tài khoản nguồn'}
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSourceAccountId(val);
                  if (val === 'tk_van') setMemberId('van');
                  else if (val === 'tk_thang') setMemberId('thang');
                }}
                disabled={transactionType === 'CREDIT_PURCHASE'}
                className="w-full bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400/50"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type === 'CREDIT_LIABILITY' ? 'Dư nợ' : 'Tiền mặt'})
                  </option>
                ))}
              </select>
            </div>

            {/* If Transfer, show destination account; Else show Category Dropdown */}
            {transactionType === 'TRANSFER' ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Chuyển đến tài khoản</label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400/50"
                >
                  <option value="tk_van">TK Vân</option>
                  <option value="tk_thang">TK Thắng</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">Danh mục</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400/50"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories
                    .filter((c) =>
                      transactionType === 'INCOME'
                        ? c.kind === 'INCOME' || c.kind === 'BOTH'
                        : c.kind === 'EXPENSE' || c.kind === 'BOTH'
                    )
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat.dailySpend ? '• (Hàng ngày)' : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* More Options Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1.5 font-semibold"
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Tùy chọn nâng cao (Sự kiện, Quỹ, Ngày, Ghi chú...)</span>
              </span>
              {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMore && (
              <div className="space-y-3 pt-2 pb-1 border-t border-white/10 animate-in fade-in duration-150">
                {/* Date Picker */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Ngày giao dịch</label>
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Event Link */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Thuộc Sự kiện / Chuyến đi</label>
                    <select
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Không có --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Fund Link */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Thuộc Quỹ dự phòng/gom tiền</label>
                    <select
                      value={fundId}
                      onChange={(e) => setFundId(e.target.value)}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Không có --</option>
                      {funds.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Counterparty Link (for Lend / Borrow) */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Đối tác / Người liên quan</label>
                    <select
                      value={counterpartyId}
                      onChange={(e) => setCounterpartyId(e.target.value)}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Không có --</option>
                      {counterparties.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ghi chú chi tiết</label>
                  <input
                    type="text"
                    placeholder="Ghi chú thêm nếu cần..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 border border-white/25 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Lưu giao dịch ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
