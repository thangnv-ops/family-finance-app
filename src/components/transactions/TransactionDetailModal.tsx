import React, { useState } from 'react';
import {
  Transaction,
  Category,
  Member,
  FinancialAccount,
  EventBudget,
  Goal,
  Counterparty,
} from '../../types/finance';
import { formatVND, formatDateVN } from '../../lib/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { transactionCategoryId } from '../../lib/ledger';
import {
  X,
  Trash2,
  Edit3,
  Copy,
  Calendar,
  Layers,
  CreditCard,
  Wallet,
  Clock,
  User,
  Check,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  categories: Category[];
  accounts: FinancialAccount[];
  members: Member[];
  events: EventBudget[];
  goals: Goal[];
  counterparties: Counterparty[];
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  categories,
  accounts,
  members,
  events,
  goals,
  counterparties,
  onUpdateTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  if (!transaction) return null;

  const effectiveCategoryId = transactionCategoryId(
    transaction.transactionType,
    transaction.categoryId
  );
  const cat = effectiveCategoryId
    ? categories.find((c) => c.id === effectiveCategoryId)
    : undefined;
  const member = members.find((m) => m.id === transaction.memberId);
  const srcAccount = accounts.find((a) => a.id === transaction.sourceAccountId);
  const destAccount = accounts.find((a) => a.id === transaction.destinationAccountId);
  const event = events.find((e) => e.id === transaction.eventId);
  const goal = goals.find((item) => item.id === transaction.goalId);
  const counterparty = counterparties.find((c) => c.id === transaction.counterpartyId);

  const startEdit = () => {
    setEditAmount(String(transaction.amount));
    setEditDesc(transaction.description);
    setEditCategory(transaction.categoryId || '');
    setEditNote(transaction.note || '');
    setEditDate(transaction.transactionDate);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(editAmount.replace(/[^0-9]/g, ''), 10);
    if (!parsed || parsed <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    if (!editDesc.trim()) {
      alert('Vui lòng nhập nội dung.');
      return;
    }

    onUpdateTransaction({
      ...transaction,
      amount: parsed,
      description: editDesc.trim(),
      categoryId: transactionCategoryId(transaction.transactionType, editCategory),
      note: editNote.trim() || undefined,
      transactionDate: editDate,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa giao dịch "${transaction.description}"?`)) {
      onDeleteTransaction(transaction.id);
      onClose();
    }
  };

  const isIncome = transaction.transactionType === 'INCOME';
  const isTransfer = transaction.transactionType === 'TRANSFER';
  const isCredit = transaction.transactionType === 'CREDIT_PURCHASE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-950/85 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_16px_64px_rgba(0,0,0,0.7)] text-slate-100 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03]">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>Chi tiết giao dịch</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEditing ? (
          <div className="p-5 space-y-4 text-xs">
            {/* Amount Banner */}
            <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-center">
              <span className="text-slate-400 block mb-1">Số tiền</span>
              <div
                className={`text-2xl sm:text-3xl font-black ${
                  isIncome
                    ? 'text-emerald-400'
                    : isTransfer
                    ? 'text-indigo-300'
                    : isCredit
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                {formatVND(transaction.amount)}
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1">
                {transaction.description}
              </div>
            </div>

            {/* Grid of properties */}
            <div className="space-y-2.5 bg-white/[0.04] backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Ngày giao dịch
                </span>
                <span className="font-semibold text-white">
                  {formatDateVN(transaction.transactionDate)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Loại giao dịch
                </span>
                <span className="font-semibold text-white px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[11px]">
                  {transaction.transactionType}
                </span>
              </div>

              {cat && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CategoryIcon iconName={cat.icon} color={cat.color} className="w-3.5 h-3.5" />
                    Danh mục
                  </span>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full ring-2 ring-white/20"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Thành viên
                </span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: member?.avatarColor || '#fff' }}
                  />
                  {member?.name || transaction.memberId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                  Tài khoản nguồn
                </span>
                <span className="font-semibold text-white">
                  {srcAccount ? srcAccount.name : 'N/A'}
                </span>
              </div>

              {destAccount && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                    Tài khoản đích
                  </span>
                  <span className="font-semibold text-white">{destAccount.name}</span>
                </div>
              )}

              {event && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sự kiện</span>
                  <span className="font-semibold text-indigo-300">{event.name}</span>
                </div>
              )}

              {goal && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Wishlist</span>
                  <span className="font-semibold text-purple-300">{goal.title}</span>
                </div>
              )}

              {counterparty && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Đối tác</span>
                  <span className="font-semibold text-cyan-300">{counterparty.name}</span>
                </div>
              )}

              {transaction.note && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-slate-400 block mb-0.5">Ghi chú:</span>
                  <p className="text-slate-200 italic">{transaction.note}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={startEdit}
                className="py-2.5 bg-white/[0.08] hover:bg-white/15 border border-white/10 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Sửa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDuplicateTransaction(transaction);
                  onClose();
                }}
                className="py-2.5 bg-white/[0.08] hover:bg-white/15 border border-white/10 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Nhân bản</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/20 text-rose-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSaveEdit} className="p-5 space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Số tiền (VND)</label>
              <input
                type="text"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-400/50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Nội dung</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-400/50"
              />
            </div>

            {!isTransfer && (
              <div>
                <label className="block text-slate-400 mb-1">Danh mục</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400/50"
                >
                  <option value="">-- Không chọn --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1">Ngày giao dịch</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400/50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Ghi chú</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-400/50"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-white/[0.08] hover:bg-white/15 border border-white/10 text-slate-300 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 border border-white/20"
              >
                <Check className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
