import React from 'react';
import { formatVND } from '../../lib/formatters';
import { AccountBalances } from '../../lib/ledger';
import { Bell, Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  householdName: string;
  balances: AccountBalances;
  onOpenNotifications: () => void;
  unreadAlertsCount: number;
  onOpenQuickAdd: () => void;
  onExportBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  householdName,
  balances,
  onOpenNotifications,
  unreadAlertsCount,
  onOpenQuickAdd,
  onExportBackup,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        {/* Brand & Household */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 flex items-center gap-1">
                {householdName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Quản lý tài chính gia đình &middot; Ledger chuẩn mực
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Net Worth view on desktop */}
          <div className="hidden lg:flex flex-col items-end pr-3 border-r border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tài sản ròng</span>
            <span className="text-xs font-bold text-emerald-600">{formatVND(balances.netWorth)}</span>
          </div>

          <button
            onClick={onExportBackup}
            title="Sao lưu dữ liệu JSON"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNotifications}
            title="Thông báo & Cảnh báo"
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-sm active:scale-95 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 border border-emerald-400/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>+ Nhập nhanh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
