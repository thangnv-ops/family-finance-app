/**
 * LocalStorage persistence engine with full seed dataset matching Thắng & Vân 2026 specs
 */

import {
  Member,
  FinancialAccount,
  Category,
  Transaction,
  SuggestionRule,
  Budget,
  IncomePlan,
  CreditCardConfig,
  CreditCardStatement,
  InstallmentPlan,
  SavingsDeposit,
  Counterparty,
  Loan,
  Fund,
  PlannedExpense,
  Goal,
  EventBudget,
  EventBudgetItem,
  EventContribution,
  RecurringTransaction,
  AuditLog,
} from '../types/finance';
import { getCurrentMonthStr, getTodayDateStr } from './formatters';

const STORAGE_KEY = 'family_finance_thang_van_v3';

export interface AppState {
  householdName: string;
  currentMemberId: string; // 'all' | 'thang' | 'van'
  members: Member[];
  accounts: FinancialAccount[];
  categories: Category[];
  transactions: Transaction[];
  suggestionRules: SuggestionRule[];
  budgets: Budget[];
  incomePlans: IncomePlan[];
  creditCardConfig: CreditCardConfig;
  creditCardStatements: CreditCardStatement[];
  installmentPlans: InstallmentPlan[];
  savingsDeposits: SavingsDeposit[];
  counterparties: Counterparty[];
  loans: Loan[];
  funds: Fund[];
  plannedExpenses: PlannedExpense[];
  goals: Goal[];
  events: EventBudget[];
  eventItems: EventBudgetItem[];
  eventContributions: EventContribution[];
  recurringTransactions: RecurringTransaction[];
  auditLogs: AuditLog[];
  lastBackupDate?: string;
}

export const INITIAL_MEMBERS: Member[] = [
  { id: 'thang', name: 'Thắng', avatarColor: '#3b82f6', role: 'OWNER', isActive: true },
  { id: 'van', name: 'Vân', avatarColor: '#ec4899', role: 'MEMBER', isActive: true },
];

export const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'tk_thang',
    name: 'TK Thắng',
    type: 'CASH_POOL',
    ownerMemberId: 'thang',
    openingBalance: 32_500_000,
    isActive: true,
    color: '#2563eb',
  },
  {
    id: 'tk_van',
    name: 'TK Vân',
    type: 'CASH_POOL',
    ownerMemberId: 'van',
    openingBalance: 21_800_000,
    isActive: true,
    color: '#db2777',
  },
  {
    id: 'tin_dung',
    name: 'Tín dụng',
    type: 'CREDIT_LIABILITY',
    ownerMemberId: null,
    openingBalance: 6_450_000, // Current debt
    isActive: true,
    color: '#d97706',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_tieu_vat_thang', name: 'Tiêu vặt Thắng', kind: 'EXPENSE', icon: 'User', color: '#3b82f6', dailySpend: true, ownerScope: 'THANG', isActive: true },
  { id: 'cat_tieu_vat_van', name: 'Tiêu vặt Vân', kind: 'EXPENSE', icon: 'Heart', color: '#ec4899', dailySpend: true, ownerScope: 'VAN', isActive: true },
  { id: 'cat_an_ngoai', name: 'Ăn ngoài & Cafe', kind: 'EXPENSE', icon: 'Coffee', color: '#f97316', dailySpend: true, ownerScope: 'ALL', isActive: true },
  { id: 'cat_xang_xe', name: 'Xăng xe & Di chuyển', kind: 'EXPENSE', icon: 'Car', color: '#6366f1', dailySpend: true, ownerScope: 'ALL', isActive: true },
  { id: 'cat_mua_sam', name: 'Mua sắm gia đình', kind: 'EXPENSE', icon: 'ShoppingBag', color: '#8b5cf6', dailySpend: true, ownerScope: 'ALL', isActive: true },
  { id: 'cat_sieu_thi', name: 'Đi chợ & Siêu thị', kind: 'EXPENSE', icon: 'ShoppingCart', color: '#10b981', dailySpend: true, ownerScope: 'ALL', isActive: true },
  { id: 'cat_tien_nha', name: 'Tiền nhà & Chung cư', kind: 'EXPENSE', icon: 'Home', color: '#0ea5e9', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_tien_co_dinh', name: 'Điện, Nước & Net', kind: 'EXPENSE', icon: 'Zap', color: '#eab308', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_bao_hiem', name: 'Bảo hiểm nhân thọ', kind: 'EXPENSE', icon: 'ShieldCheck', color: '#14b8a6', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_hoc_tap', name: 'Học tập & Sách', kind: 'EXPENSE', icon: 'BookOpen', color: '#84cc16', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_lam_dep', name: 'Làm đẹp & Chăm sóc', kind: 'EXPENSE', icon: 'Sparkles', color: '#f43f5e', dailySpend: true, ownerScope: 'VAN', isActive: true },
  { id: 'cat_ve_bac_ninh', name: 'Về Bắc Ninh', kind: 'EXPENSE', icon: 'Navigation', color: '#64748b', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_ve_ha_tinh', name: 'Về Hà Tĩnh', kind: 'EXPENSE', icon: 'MapPin', color: '#78716c', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_chi_cho_con', name: 'Chi cho con (Xoài)', kind: 'EXPENSE', icon: 'Baby', color: '#06b6d4', dailySpend: true, ownerScope: 'ALL', isActive: true },
  { id: 'cat_linh_tinh', name: 'Linh Tinh / Khác', kind: 'EXPENSE', icon: 'MoreHorizontal', color: '#94a3b8', dailySpend: true, ownerScope: 'ALL', isActive: true },
  // Income
  { id: 'cat_luong_thang', name: 'Lương Thắng', kind: 'INCOME', icon: 'Briefcase', color: '#2563eb', dailySpend: false, ownerScope: 'THANG', isActive: true },
  { id: 'cat_luong_van', name: 'Lương Vân', kind: 'INCOME', icon: 'Award', color: '#db2777', dailySpend: false, ownerScope: 'VAN', isActive: true },
  { id: 'cat_thuong_khac', name: 'Thưởng & Thu nhập ngoài', kind: 'INCOME', icon: 'Gift', color: '#16a34a', dailySpend: false, ownerScope: 'ALL', isActive: true },
  { id: 'cat_mung_cuoi', name: 'Mừng cưới / Thôi nôi', kind: 'INCOME', icon: 'Coins', color: '#ca8a04', dailySpend: false, ownerScope: 'ALL', isActive: true },
];

export const INITIAL_RULES: SuggestionRule[] = [
  { id: 'r1', keyword: 'hoàn shopee', matchType: 'CONTAINS', suggestedTransactionType: 'CREDIT_REFUND', suggestedCategoryId: 'cat_mua_sam', suggestedSourceAccountId: 'tin_dung', priority: 1, isActive: true },
  { id: 'r2', keyword: 'shopee', matchType: 'CONTAINS', suggestedTransactionType: 'CREDIT_PURCHASE', suggestedCategoryId: 'cat_mua_sam', suggestedSourceAccountId: 'tin_dung', priority: 3, isActive: true },
  { id: 'r3', keyword: 'lương thắng', matchType: 'CONTAINS', suggestedTransactionType: 'INCOME', suggestedCategoryId: 'cat_luong_thang', suggestedDestinationAccountId: 'tk_thang', suggestedMemberId: 'thang', priority: 2, isActive: true },
  { id: 'r4', keyword: 'lương vân', matchType: 'CONTAINS', suggestedTransactionType: 'INCOME', suggestedCategoryId: 'cat_luong_van', suggestedDestinationAccountId: 'tk_van', suggestedMemberId: 'van', priority: 2, isActive: true },
  { id: 'r5', keyword: 'xăng', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_xang_xe', priority: 4, isActive: true },
  { id: 'r6', keyword: 'grab', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_xang_xe', priority: 4, isActive: true },
  { id: 'r7', keyword: 'cafe', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_an_ngoai', priority: 5, isActive: true },
  { id: 'r8', keyword: 'ăn trưa', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_an_ngoai', priority: 5, isActive: true },
  { id: 'r9', keyword: 'siêu thị', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_sieu_thi', priority: 5, isActive: true },
  { id: 'r10', keyword: 'chợ', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_sieu_thi', priority: 5, isActive: true },
  { id: 'r11', keyword: 'tiền nhà', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_tien_nha', priority: 3, isActive: true },
  { id: 'r12', keyword: 'trả thẻ', matchType: 'CONTAINS', suggestedTransactionType: 'CREDIT_PAYMENT', suggestedDestinationAccountId: 'tin_dung', priority: 2, isActive: true },
  { id: 'r13', keyword: 'linh tinh', matchType: 'CONTAINS', suggestedTransactionType: 'EXPENSE', suggestedCategoryId: 'cat_linh_tinh', priority: 9, isActive: true },
];

export function getInitialSeedState(): AppState {
  const currentYM = getCurrentMonthStr();
  const today = getTodayDateStr();

  const transactions: Transaction[] = [
    {
      id: 'tx_init_1',
      transactionDate: `${currentYM}-05`,
      transactionType: 'INCOME',
      amount: 43_000_000,
      currency: 'VND',
      description: 'Lương tháng Thắng (Công ty chuyển khoản)',
      categoryId: 'cat_luong_thang',
      destinationAccountId: 'tk_thang',
      memberId: 'thang',
      createdAt: `${currentYM}-05T08:30:00Z`,
      updatedAt: `${currentYM}-05T08:30:00Z`,
    },
    {
      id: 'tx_init_2',
      transactionDate: `${currentYM}-10`,
      transactionType: 'INCOME',
      amount: 16_500_000,
      currency: 'VND',
      description: 'Lương tháng Vân',
      categoryId: 'cat_luong_van',
      destinationAccountId: 'tk_van',
      memberId: 'van',
      createdAt: `${currentYM}-10T09:15:00Z`,
      updatedAt: `${currentYM}-10T09:15:00Z`,
    },
    {
      id: 'tx_init_3',
      transactionDate: `${currentYM}-06`,
      transactionType: 'TRANSFER',
      amount: 15_000_000,
      currency: 'VND',
      description: 'Thắng chuyển Vân chi tiêu gia đình + tiền nhà',
      sourceAccountId: 'tk_thang',
      destinationAccountId: 'tk_van',
      memberId: 'thang',
      createdAt: `${currentYM}-06T10:00:00Z`,
      updatedAt: `${currentYM}-06T10:00:00Z`,
    },
    {
      id: 'tx_init_4',
      transactionDate: `${currentYM}-07`,
      transactionType: 'EXPENSE',
      amount: 6_500_000,
      currency: 'VND',
      description: 'Thanh toán tiền thuê căn hộ tháng này',
      categoryId: 'cat_tien_nha',
      sourceAccountId: 'tk_van',
      memberId: 'van',
      createdAt: `${currentYM}-07T11:00:00Z`,
      updatedAt: `${currentYM}-07T11:00:00Z`,
    },
    {
      id: 'tx_init_5',
      transactionDate: `${currentYM}-12`,
      transactionType: 'CREDIT_PURCHASE',
      amount: 1_250_000,
      currency: 'VND',
      description: 'Shopee mua tã bỉm & đồ dùng cho Xoài',
      categoryId: 'cat_chi_cho_con',
      sourceAccountId: 'tin_dung',
      memberId: 'van',
      createdAt: `${currentYM}-12T14:20:00Z`,
      updatedAt: `${currentYM}-12T14:20:00Z`,
    },
    {
      id: 'tx_init_6',
      transactionDate: `${currentYM}-14`,
      transactionType: 'EXPENSE',
      amount: 850_000,
      currency: 'VND',
      description: 'Ăn tối lẩu Haidilao cuối tuần cả nhà',
      categoryId: 'cat_an_ngoai',
      sourceAccountId: 'tk_thang',
      memberId: 'thang',
      createdAt: `${currentYM}-14T19:40:00Z`,
      updatedAt: `${currentYM}-14T19:40:00Z`,
    },
    {
      id: 'tx_init_7',
      transactionDate: `${currentYM}-16`,
      transactionType: 'EXPENSE',
      amount: 500_000,
      currency: 'VND',
      description: 'Đổ xăng ô tô đi làm cả tuần',
      categoryId: 'cat_xang_xe',
      sourceAccountId: 'tk_thang',
      memberId: 'thang',
      createdAt: `${currentYM}-16T08:10:00Z`,
      updatedAt: `${currentYM}-16T08:10:00Z`,
    },
    {
      id: 'tx_init_8',
      transactionDate: `${currentYM}-18`,
      transactionType: 'EXPENSE',
      amount: 1_120_000,
      currency: 'VND',
      description: 'Siêu thị Winmart mua thực phẩm tuần',
      categoryId: 'cat_sieu_thi',
      sourceAccountId: 'tk_van',
      memberId: 'van',
      createdAt: `${currentYM}-18T17:30:00Z`,
      updatedAt: `${currentYM}-18T17:30:00Z`,
    },
    {
      id: 'tx_init_9',
      transactionDate: `${currentYM}-19`,
      transactionType: 'EXPENSE',
      amount: 350_000,
      currency: 'VND',
      description: 'Cafe gặp gỡ bạn bè cuối tuần',
      categoryId: 'cat_tieu_vat_thang',
      sourceAccountId: 'tk_thang',
      memberId: 'thang',
      createdAt: `${currentYM}-19T10:00:00Z`,
      updatedAt: `${currentYM}-19T10:00:00Z`,
    },
    {
      id: 'tx_init_10',
      transactionDate: `${currentYM}-20`,
      transactionType: 'CREDIT_PAYMENT',
      amount: 4_500_000,
      currency: 'VND',
      description: 'Thanh toán sao kê thẻ tín dụng Techcombank',
      sourceAccountId: 'tk_thang',
      destinationAccountId: 'tin_dung',
      memberId: 'thang',
      createdAt: `${currentYM}-20T15:00:00Z`,
      updatedAt: `${currentYM}-20T15:00:00Z`,
    },
    {
      id: 'tx_init_11',
      transactionDate: `${currentYM}-21`,
      transactionType: 'SAVINGS_DEPOSIT',
      amount: 10_000_000,
      currency: 'VND',
      description: 'Gửi tiết kiệm online Techcombank 6 tháng',
      sourceAccountId: 'tk_thang',
      memberId: 'thang',
      savingsDepositId: 'sav_1',
      createdAt: `${currentYM}-21T16:00:00Z`,
      updatedAt: `${currentYM}-21T16:00:00Z`,
    },
    {
      id: 'tx_init_12',
      transactionDate: today,
      transactionType: 'EXPENSE',
      amount: 180_000,
      currency: 'VND',
      description: 'Ăn trưa văn phòng + Cafe Highlands',
      categoryId: 'cat_an_ngoai',
      sourceAccountId: 'tk_thang',
      memberId: 'thang',
      createdAt: `${today}T12:30:00Z`,
      updatedAt: `${today}T12:30:00Z`,
    },
  ];

  const budgets: Budget[] = [
    { id: 'b1', month: currentYM, categoryId: 'cat_an_ngoai', budgetType: 'EXPENSE_LIMIT', plannedAmount: 4_500_000 },
    { id: 'b2', month: currentYM, categoryId: 'cat_sieu_thi', budgetType: 'EXPENSE_LIMIT', plannedAmount: 5_000_000 },
    { id: 'b3', month: currentYM, categoryId: 'cat_xang_xe', budgetType: 'EXPENSE_LIMIT', plannedAmount: 2_000_000 },
    { id: 'b4', month: currentYM, categoryId: 'cat_mua_sam', budgetType: 'EXPENSE_LIMIT', plannedAmount: 3_000_000 },
    { id: 'b5', month: currentYM, categoryId: 'cat_tieu_vat_thang', budgetType: 'EXPENSE_LIMIT', plannedAmount: 2_500_000 },
    { id: 'b6', month: currentYM, categoryId: 'cat_tieu_vat_van', budgetType: 'EXPENSE_LIMIT', plannedAmount: 2_500_000 },
    { id: 'b7', month: currentYM, categoryId: 'cat_chi_cho_con', budgetType: 'EXPENSE_LIMIT', plannedAmount: 3_500_000 },
    { id: 'b8', month: currentYM, categoryId: 'cat_tien_nha', budgetType: 'EXPENSE_LIMIT', plannedAmount: 6_500_000 },
    { id: 'b9', month: currentYM, categoryId: 'cat_tien_co_dinh', budgetType: 'EXPENSE_LIMIT', plannedAmount: 2_200_000 },
    { id: 'b10', month: currentYM, categoryId: 'cat_bao_hiem', budgetType: 'EXPENSE_LIMIT', plannedAmount: 2_000_000 },
  ];

  const incomePlans: IncomePlan[] = [
    { id: 'ip1', month: currentYM, sourceName: 'Lương Thắng', memberId: 'thang', expectedAmount: 43_000_000 },
    { id: 'ip2', month: currentYM, sourceName: 'Lương Vân', memberId: 'van', expectedAmount: 16_500_000 },
  ];

  const creditCardConfig: CreditCardConfig = {
    accountId: 'tin_dung',
    cardName: 'Techcombank Visa Signature',
    bank: 'Techcombank',
    creditLimit: 60_000_000,
    statementDay: 20,
    dueDay: 5,
    annualFee: 1_100_000,
    status: 'ACTIVE',
    last4Digits: '8868',
  };

  const creditCardStatements: CreditCardStatement[] = [
    {
      id: 'stmt_1',
      periodStart: `${currentYM}-21`,
      periodEnd: `${currentYM}-20`,
      statementDate: `${currentYM}-20`,
      dueDate: `${currentYM}-05`,
      calculatedAmount: 4_500_000,
      actualStatementAmount: 4_500_000,
      paidAmount: 4_500_000,
      minimumPayment: 500_000,
      status: 'PAID',
    },
  ];

  const installmentPlans: InstallmentPlan[] = [
    {
      id: 'inst_1',
      title: 'Điện thoại iPhone 15 Pro Max',
      principal: 28_000_000,
      months: 6,
      annualInterestRate: 0,
      fee: 450_000,
      monthlyPayment: 4_666_667,
      startMonth: '2026-04',
      paidMonths: 4,
      remainingPrincipal: 9_333_333,
      status: 'ACTIVE',
    },
  ];

  const savingsDeposits: SavingsDeposit[] = [
    {
      id: 'sav_1',
      provider: 'Techcombank',
      productName: 'Tiết kiệm Online 6 Tháng',
      ownerMemberId: 'thang',
      openedAt: '2026-03-15',
      principal: 60_000_000,
      annualInterestRate: 5.6,
      termMonths: 6,
      maturityDate: '2026-09-15',
      expectedInterest: 1_680_000,
      expectedMaturityAmount: 61_680_000,
      autoRenew: true,
      status: 'ACTIVE',
      note: 'Gửi kỳ hạn tích lũy gia đình',
    },
    {
      id: 'sav_2',
      provider: 'VPBank',
      productName: 'Super Saver 12 Tháng',
      ownerMemberId: 'van',
      openedAt: '2026-01-10',
      principal: 100_000_000,
      annualInterestRate: 6.2,
      termMonths: 12,
      maturityDate: '2027-01-10',
      expectedInterest: 6_200_000,
      expectedMaturityAmount: 106_200_000,
      autoRenew: false,
      status: 'ACTIVE',
      note: 'Quỹ mua xe tương lai',
    },
  ];

  const counterparties: Counterparty[] = [
    { id: 'cp_nam', name: 'Bạn Nam', phone: '0987654321', note: 'Bạn đại học Thắng' },
    { id: 'cp_lan', name: 'Chị Lan', phone: '0912345678', note: 'Chị gái Vân' },
  ];

  const loans: Loan[] = [
    {
      id: 'loan_1',
      counterpartyId: 'cp_nam',
      direction: 'RECEIVABLE', // Cho vay
      principal: 5_000_000,
      outstandingPrincipal: 5_000_000,
      annualInterestRate: 0,
      expectedDueDate: `${currentYM}-30`,
      repaymentPriority: 1,
      status: 'ACTIVE',
      note: 'Nam mượn xử lý việc gấp',
      createdAt: `${currentYM}-02`,
    },
    {
      id: 'loan_2',
      counterpartyId: 'cp_lan',
      direction: 'RECEIVABLE',
      principal: 10_000_000,
      outstandingPrincipal: 5_000_000,
      annualInterestRate: 0,
      expectedDueDate: '2026-10-15',
      repaymentPriority: 2,
      status: 'PARTIALLY_PAID',
      note: 'Chị Lan mượn sửa nhà (đã trả 5tr)',
      createdAt: '2026-05-10',
    },
  ];

  const funds: Fund[] = [
    {
      id: 'fund_1',
      name: 'Quỹ Dự phòng Khẩn cấp',
      targetAmount: 50_000_000,
      currentAmount: 35_000_000,
      plannedContributionPerMonth: 3_000_000,
      backingAccountId: 'tk_thang',
      icon: 'Shield',
      color: '#10b981',
      status: 'ACTIVE',
    },
    {
      id: 'fund_2',
      name: 'Quỹ Du lịch Hè & Nghỉ lễ',
      targetAmount: 20_000_000,
      currentAmount: 14_500_000,
      dueDate: '2026-10-01',
      cycleMonths: 12,
      plannedContributionPerMonth: 2_000_000,
      backingAccountId: 'tk_van',
      icon: 'Plane',
      color: '#f59e0b',
      status: 'ACTIVE',
    },
    {
      id: 'fund_3',
      name: 'Quỹ Bảo hiểm & Sức khỏe gia đình',
      targetAmount: 24_000_000,
      currentAmount: 16_000_000,
      dueDate: '2026-11-15',
      cycleMonths: 12,
      plannedContributionPerMonth: 2_000_000,
      backingAccountId: 'tk_thang',
      icon: 'HeartPulse',
      color: '#ec4899',
      status: 'ACTIVE',
    },
  ];

  const plannedExpenses: PlannedExpense[] = [
    {
      id: 'pe_1',
      title: 'Bảo dưỡng xe định kỳ 20.000km',
      expectedDate: `${currentYM}-28`,
      expectedAmount: 4_200_000,
      priority: 'HIGH',
      status: 'READY',
      note: 'Thay dầu động cơ, lọc gió, kiểm tra lốp',
    },
    {
      id: 'pe_2',
      title: 'Đăng ký khóa học tiếng Anh & kỹ năng',
      expectedDate: '2026-09-10',
      expectedAmount: 7_500_000,
      priority: 'MEDIUM',
      status: 'PLANNED',
      note: 'Khóa học phát triển chuyên môn',
    },
  ];

  const goals: Goal[] = [
    {
      id: 'g_1',
      title: 'Dán phim cách nhiệt 3M ô tô',
      goalType: 'PURCHASE',
      targetAmount: 7_500_000,
      savedAmount: 4_500_000,
      targetDate: '2026-09-30',
      priority: 'HIGH',
      status: 'FUNDING',
      note: 'Chống nóng mùa hè',
    },
    {
      id: 'g_2',
      title: 'Robot hút bụi lau nhà Dreame',
      goalType: 'PURCHASE',
      targetAmount: 12_000_000,
      savedAmount: 9_000_000,
      targetDate: '2026-10-15',
      priority: 'MEDIUM',
      status: 'FUNDING',
      note: 'Giảm bớt gánh nặng dọn nhà',
    },
    {
      id: 'g_3',
      title: 'Máy cạo râu Philips cao cấp',
      goalType: 'PURCHASE',
      targetAmount: 850_000,
      savedAmount: 850_000,
      status: 'DONE',
      note: 'Đã mua tháng 06/2026',
    },
  ];

  const events: EventBudget[] = [
    {
      id: 'ev_danang',
      name: 'Chuyến đi Đà Nẵng - Hội An',
      eventType: 'TRAVEL',
      startDate: '2026-09-20',
      endDate: '2026-09-24',
      budgetAmount: 18_000_000,
      status: 'PLANNING',
      note: 'Nghỉ dưỡng cùng gia đình và bạn bè',
    },
  ];

  const eventItems: EventBudgetItem[] = [
    { id: 'evi_1', eventId: 'ev_danang', title: 'Vé máy bay khứ hồi (3 người)', plannedAmount: 7_500_000, actualAmount: 7_200_000, status: 'BOOKED' },
    { id: 'evi_2', eventId: 'ev_danang', title: 'Khách sạn biển 4 đêm', plannedAmount: 5_000_000, actualAmount: 0, status: 'PLANNED' },
    { id: 'evi_3', eventId: 'ev_danang', title: 'Ăn uống hải sản & ẩm thực', plannedAmount: 4_000_000, actualAmount: 0, status: 'TODO' },
    { id: 'evi_4', eventId: 'ev_danang', title: 'Thuê xe ô tô tự lái', plannedAmount: 1_500_000, actualAmount: 0, status: 'TODO' },
  ];

  const eventContributions: EventContribution[] = [
    { id: 'evc_1', eventId: 'ev_danang', counterpartyId: 'cp_nam', amount: 3_500_000, receivedDate: '2026-08-15', contributionType: 'BANK_TRANSFER', note: 'Nam chuyển trước phần vé máy bay' },
  ];

  const recurringTransactions: RecurringTransaction[] = [
    {
      id: 'rec_1',
      title: 'Lương Thắng',
      type: 'INCOME',
      amount: 43_000_000,
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      nextDate: `${currentYM}-05`,
      categoryId: 'cat_luong_thang',
      accountId: 'tk_thang',
      memberId: 'thang',
      isActive: true,
      lastConfirmedDate: `${currentYM}-05`,
    },
    {
      id: 'rec_2',
      title: 'Lương Vân',
      type: 'INCOME',
      amount: 16_500_000,
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      nextDate: `${currentYM}-10`,
      categoryId: 'cat_luong_van',
      accountId: 'tk_van',
      memberId: 'van',
      isActive: true,
      lastConfirmedDate: `${currentYM}-10`,
    },
    {
      id: 'rec_3',
      title: 'Tiền mạng Internet FPT',
      type: 'EXPENSE',
      amount: 285_000,
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      nextDate: `${currentYM}-15`,
      categoryId: 'cat_tien_co_dinh',
      accountId: 'tk_thang',
      memberId: 'thang',
      isActive: true,
      lastConfirmedDate: `${currentYM}-15`,
    },
    {
      id: 'rec_4',
      title: 'Tiền điện nước sinh hoạt',
      type: 'EXPENSE',
      amount: 1_850_000,
      frequency: 'MONTHLY',
      dayOfMonth: 18,
      nextDate: `${currentYM}-18`,
      categoryId: 'cat_tien_co_dinh',
      accountId: 'tk_van',
      memberId: 'van',
      isActive: true,
      lastConfirmedDate: `${currentYM}-18`,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud_1',
      entityType: 'TRANSACTION',
      entityId: 'tx_init_1',
      action: 'CREATE',
      description: 'Khởi tạo dữ liệu giao dịch ban đầu cho Thắng & Vân',
      userId: 'thang',
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    householdName: 'Gia đình Thắng & Vân',
    currentMemberId: 'all',
    members: INITIAL_MEMBERS,
    accounts: INITIAL_ACCOUNTS,
    categories: INITIAL_CATEGORIES,
    transactions,
    suggestionRules: INITIAL_RULES,
    budgets,
    incomePlans,
    creditCardConfig,
    creditCardStatements,
    installmentPlans,
    savingsDeposits,
    counterparties,
    loans,
    funds,
    plannedExpenses,
    goals,
    events,
    eventItems,
    eventContributions,
    recurringTransactions,
    auditLogs,
    lastBackupDate: new Date().toISOString(),
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return { ...getInitialSeedState(), ...parsed };
  } catch (err) {
    console.error('Failed to load app state from localStorage:', err);
    return getInitialSeedState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save app state to localStorage:', err);
  }
}

export function exportAppStateAsJSON(state: AppState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = getTodayDateStr();
  a.href = url;
  a.download = `FamilyFinance_Backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAppStateFromJSON(jsonText: string): AppState {
  const parsed = JSON.parse(jsonText);
  if (!parsed.transactions || !parsed.accounts) {
    throw new Error('Dữ liệu sao lưu không đúng định dạng hợp lệ.');
  }
  // Caller persists via Supabase sync; do not write localStorage as source of truth.
  return { ...getInitialSeedState(), ...parsed };
}
