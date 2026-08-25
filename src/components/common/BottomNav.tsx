import React from 'react';
import { Home, ReceiptText, Plus, Target, PieChart, MoreHorizontal } from 'lucide-react';

export type ActiveTab = 'home' | 'transactions' | 'plan' | 'insights' | 'more';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200 text-slate-500 py-1.5 px-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around relative">
        {/* Trang chủ */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 shadow-sm scale-105'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Trang chủ</span>
        </button>

        {/* Sổ GD */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 shadow-sm scale-105'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Sổ GD</span>
        </button>

        {/* Floating Quick Add Button in Center */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={onOpenQuickAdd}
            title="Thêm nhanh giao dịch (< 10 giây)"
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-white border border-white/50 transform active:scale-90 hover:scale-105 transition-all cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="text-[9px] font-bold text-emerald-600 mt-0.5">Nhập</span>
        </div>

        {/* Kế hoạch */}
        <button
          onClick={() => onSelectTab('plan')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'plan'
              ? 'text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 shadow-sm scale-105'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Kế hoạch</span>
        </button>

        {/* Báo cáo / Insights */}
        <button
          onClick={() => onSelectTab('insights')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 shadow-sm scale-105'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Báo cáo</span>
        </button>

        {/* Mở rộng */}
        <button
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'more'
              ? 'text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 shadow-sm scale-105'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Mở rộng</span>
        </button>
      </div>
    </nav>
  );
};
