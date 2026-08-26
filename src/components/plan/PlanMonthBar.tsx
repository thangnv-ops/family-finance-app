import React from 'react';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { formatMonthVN, shiftMonth } from '../../lib/formatters';

interface PlanMonthBarProps {
  month: string;
  onMonthChange: (ym: string) => void;
  onCopyPrevious: () => void;
  copyDisabled?: boolean;
}

export const PlanMonthBar: React.FC<PlanMonthBarProps> = ({
  month,
  onMonthChange,
  onCopyPrevious,
  copyDisabled = false,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onMonthChange(shiftMonth(month, -1))}
        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        aria-label="Tháng trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-bold text-slate-900">{formatMonthVN(month)}</span>
      <button
        type="button"
        onClick={() => onMonthChange(shiftMonth(month, 1))}
        className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        aria-label="Tháng sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
    <button
      type="button"
      onClick={onCopyPrevious}
      disabled={copyDisabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
    >
      <Copy className="h-3.5 w-3.5" />
      Sao chép ngân sách tháng trước
    </button>
  </div>
);
