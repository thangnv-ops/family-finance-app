import React from 'react';
import {
  CreditCardConfig,
  CreditCardStatement,
  SavingsDeposit,
  Loan,
  Fund,
  PlannedExpense,
  Budget,
} from '../../types/finance';
import { DailyAdvisorData } from '../../lib/ledger';
import { formatVND, formatDateVN } from '../../lib/formatters';
import {
  X,
  Bell,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dailyAdvisor: DailyAdvisorData;
  creditCardConfig: CreditCardConfig;
  savingsDeposits: SavingsDeposit[];
  loans: Loan[];
  funds: Fund[];
  plannedExpenses: PlannedExpense[];
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  dailyAdvisor,
  creditCardConfig,
  savingsDeposits,
  loans,
  funds,
  plannedExpenses,
}) => {
  if (!isOpen) return null;

  const alerts: Array<{
    id: string;
    type: 'WARNING' | 'INFO' | 'DANGER';
    title: string;
    description: string;
    date?: string;
    icon: React.ElementType;
  }> = [];

  // Daily budget alert
  if (dailyAdvisor.status === 'DANGER' || dailyAdvisor.status === 'WARNING') {
    alerts.push({
      id: 'alert_budget',
      type: dailyAdvisor.status === 'DANGER' ? 'DANGER' : 'WARNING',
      title: 'Cảnh báo nhịp chi tiêu hàng ngày',
      description: `Nhịp chi hiện tại (${formatVND(dailyAdvisor.pace7Days)}/ngày) có thể làm vượt ngân sách tháng khoảng ${formatVND(Math.abs(dailyAdvisor.projectedVariance))}.`,
      icon: ShieldAlert,
    });
  }

  // Credit Card Due reminder
  alerts.push({
    id: 'alert_credit',
    type: 'INFO',
    title: `Nhắc nhở sao kê thẻ ${creditCardConfig.cardName}`,
    description: `Kỳ sao kê ngày ${creditCardConfig.statementDay}, hạn thanh toán ngày ${creditCardConfig.dueDay} hàng tháng.`,
    icon: CreditCard,
  });

  // Savings deposits
  savingsDeposits
    .filter((s) => s.status === 'ACTIVE')
    .forEach((s) => {
      alerts.push({
        id: `alert_sav_${s.id}`,
        type: 'INFO',
        title: `Sổ tiết kiệm: ${s.productName}`,
        description: `Gốc ${formatVND(s.principal)} sẽ đáo hạn vào ngày ${formatDateVN(s.maturityDate)}. Lãi dự kiến: +${formatVND(s.expectedInterest)}.`,
        date: s.maturityDate,
        icon: PiggyBank,
      });
    });

  // Planned large expenses
  plannedExpenses
    .filter((p) => p.status === 'READY' || p.status === 'PLANNED')
    .forEach((p) => {
      alerts.push({
        id: `alert_pe_${p.id}`,
        type: 'INFO',
        title: `Khoản chi lớn sắp tới: ${p.title}`,
        description: `Dự kiến chi ${formatVND(p.expectedAmount)} vào ngày ${formatDateVN(p.expectedDate)}.`,
        date: p.expectedDate,
        icon: Calendar,
      });
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-950/85 backdrop-blur-2xl border-l border-white/15 h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Trung tâm thông báo ({alerts.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Không có thông báo hoặc cảnh báo nào.
            </div>
          ) : (
            alerts.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 backdrop-blur-md shadow-sm ${
                    item.type === 'DANGER'
                      ? 'bg-rose-500/15 border-rose-400/30 text-rose-200'
                      : item.type === 'WARNING'
                      ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                      : 'bg-white/[0.05] border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-white">
                    <IconComp className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                    <span className="text-xs">{item.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">{item.description}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
