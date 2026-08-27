import type {
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
  PlannedExpense,
  Goal,
  EventBudget,
  EventBudgetItem,
  EventContribution,
  AuditLog,
  Role,
  TransactionType,
  CategoryKind,
} from '../../types/finance';

type HouseholdId = string;

function optStr(v: unknown): string | undefined {
  return v == null || v === '' ? undefined : String(v);
}

function optNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function dateStr(v: unknown): string {
  if (v == null) return '';
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function isoStr(v: unknown): string {
  if (v == null) return new Date().toISOString();
  return String(v);
}

// ---- members ----
export function memberToRow(householdId: HouseholdId, m: Member) {
  return {
    household_id: householdId,
    id: m.id,
    name: m.name,
    avatar_color: m.avatarColor,
    role: m.role,
    is_active: m.isActive,
  };
}

export function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    name: String(row.name),
    avatarColor: String(row.avatar_color ?? '#64748b'),
    role: row.role as Role,
    isActive: Boolean(row.is_active),
  };
}

// ---- accounts ----
export function accountToRow(householdId: HouseholdId, a: FinancialAccount) {
  return {
    household_id: householdId,
    id: a.id,
    name: a.name,
    type: a.type,
    owner_member_id: a.ownerMemberId,
    opening_balance: a.openingBalance,
    is_active: a.isActive,
    color: a.color,
  };
}

export function rowToAccount(row: Record<string, unknown>): FinancialAccount {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as FinancialAccount['type'],
    ownerMemberId: row.owner_member_id == null ? null : String(row.owner_member_id),
    openingBalance: Number(row.opening_balance ?? 0),
    isActive: Boolean(row.is_active),
    color: String(row.color ?? '#64748b'),
  };
}

// ---- categories ----
export function categoryToRow(householdId: HouseholdId, c: Category) {
  return {
    household_id: householdId,
    id: c.id,
    name: c.name,
    kind: c.kind,
    icon: c.icon,
    color: c.color,
    daily_spend: c.dailySpend,
    owner_scope: c.ownerScope ?? null,
    is_active: c.isActive,
  };
}

export function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as CategoryKind,
    icon: String(row.icon),
    color: String(row.color),
    dailySpend: Boolean(row.daily_spend),
    ownerScope: optStr(row.owner_scope) as Category['ownerScope'],
    isActive: Boolean(row.is_active),
  };
}

// ---- transactions ----
export function transactionToRow(householdId: HouseholdId, t: Transaction) {
  return {
    household_id: householdId,
    id: t.id,
    transaction_date: t.transactionDate,
    transaction_type: t.transactionType,
    amount: t.amount,
    currency: t.currency,
    description: t.description,
    note: t.note ?? null,
    category_id: t.categoryId ?? null,
    source_account_id: t.sourceAccountId ?? null,
    destination_account_id: t.destinationAccountId ?? null,
    member_id: t.memberId,
    counterparty_id: t.counterpartyId ?? null,
    event_id: t.eventId ?? null,
    goal_id: t.goalId ?? null,
    savings_deposit_id: t.savingsDepositId ?? null,
    loan_id: t.loanId ?? null,
    reversal_of_transaction_id: t.reversalOfTransactionId ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt ?? null,
  };
}

export function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    transactionDate: dateStr(row.transaction_date),
    transactionType: row.transaction_type as TransactionType,
    amount: Number(row.amount),
    currency: 'VND',
    description: String(row.description ?? ''),
    note: optStr(row.note),
    categoryId: optStr(row.category_id),
    sourceAccountId: optStr(row.source_account_id),
    destinationAccountId: optStr(row.destination_account_id),
    memberId: String(row.member_id),
    counterpartyId: optStr(row.counterparty_id),
    eventId: optStr(row.event_id),
    goalId: optStr(row.goal_id),
    savingsDepositId: optStr(row.savings_deposit_id),
    loanId: optStr(row.loan_id),
    reversalOfTransactionId: optStr(row.reversal_of_transaction_id),
    createdAt: isoStr(row.created_at),
    updatedAt: isoStr(row.updated_at),
    deletedAt: row.deleted_at == null ? null : isoStr(row.deleted_at),
  };
}

// ---- suggestion rules ----
export function suggestionRuleToRow(householdId: HouseholdId, r: SuggestionRule) {
  return {
    household_id: householdId,
    id: r.id,
    keyword: r.keyword,
    match_type: r.matchType,
    suggested_transaction_type: r.suggestedTransactionType,
    suggested_category_id: r.suggestedCategoryId ?? null,
    suggested_source_account_id: r.suggestedSourceAccountId ?? null,
    suggested_destination_account_id: r.suggestedDestinationAccountId ?? null,
    suggested_member_id: r.suggestedMemberId ?? null,
    priority: r.priority,
    is_active: r.isActive,
  };
}

export function rowToSuggestionRule(row: Record<string, unknown>): SuggestionRule {
  return {
    id: String(row.id),
    keyword: String(row.keyword),
    matchType: row.match_type as SuggestionRule['matchType'],
    suggestedTransactionType: row.suggested_transaction_type as TransactionType,
    suggestedCategoryId: optStr(row.suggested_category_id),
    suggestedSourceAccountId: optStr(row.suggested_source_account_id),
    suggestedDestinationAccountId: optStr(row.suggested_destination_account_id),
    suggestedMemberId: optStr(row.suggested_member_id),
    priority: Number(row.priority ?? 100),
    isActive: Boolean(row.is_active),
  };
}

// ---- budgets ----
export function budgetToRow(householdId: HouseholdId, b: Budget) {
  return {
    household_id: householdId,
    id: b.id,
    month: b.month,
    category_id: b.categoryId,
    member_id: b.memberId ?? null,
    budget_type: b.budgetType,
    planned_amount: b.plannedAmount,
  };
}

export function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    month: String(row.month),
    categoryId: String(row.category_id),
    memberId: optStr(row.member_id),
    budgetType: row.budget_type as Budget['budgetType'],
    plannedAmount: Number(row.planned_amount ?? 0),
  };
}

// ---- income plans ----
export function incomePlanToRow(householdId: HouseholdId, p: IncomePlan) {
  return {
    household_id: householdId,
    id: p.id,
    month: p.month,
    source_name: p.sourceName,
    member_id: p.memberId,
    expected_amount: p.expectedAmount,
  };
}

export function rowToIncomePlan(row: Record<string, unknown>): IncomePlan {
  return {
    id: String(row.id),
    month: String(row.month),
    sourceName: String(row.source_name),
    memberId: String(row.member_id),
    expectedAmount: Number(row.expected_amount ?? 0),
  };
}

// ---- credit card config ----
export function creditCardConfigToRow(householdId: HouseholdId, c: CreditCardConfig) {
  return {
    household_id: householdId,
    account_id: c.accountId,
    card_name: c.cardName,
    bank: c.bank,
    credit_limit: c.creditLimit,
    statement_day: c.statementDay,
    due_day: c.dueDay,
    annual_fee: c.annualFee,
    status: c.status,
    last4_digits: c.last4Digits ?? null,
  };
}

export function rowToCreditCardConfig(row: Record<string, unknown>): CreditCardConfig {
  return {
    accountId: 'tin_dung',
    cardName: String(row.card_name ?? ''),
    bank: String(row.bank ?? ''),
    creditLimit: Number(row.credit_limit ?? 0),
    statementDay: Number(row.statement_day ?? 1),
    dueDay: Number(row.due_day ?? 1),
    annualFee: Number(row.annual_fee ?? 0),
    status: row.status as CreditCardConfig['status'],
    last4Digits: optStr(row.last4_digits),
  };
}

// ---- credit card statements ----
export function creditCardStatementToRow(householdId: HouseholdId, s: CreditCardStatement) {
  return {
    household_id: householdId,
    id: s.id,
    period_start: s.periodStart,
    period_end: s.periodEnd,
    statement_date: s.statementDate,
    due_date: s.dueDate,
    calculated_amount: s.calculatedAmount,
    actual_statement_amount: s.actualStatementAmount ?? null,
    paid_amount: s.paidAmount,
    minimum_payment: s.minimumPayment ?? null,
    status: s.status,
  };
}

export function rowToCreditCardStatement(row: Record<string, unknown>): CreditCardStatement {
  return {
    id: String(row.id),
    periodStart: dateStr(row.period_start),
    periodEnd: dateStr(row.period_end),
    statementDate: dateStr(row.statement_date),
    dueDate: dateStr(row.due_date),
    calculatedAmount: Number(row.calculated_amount ?? 0),
    actualStatementAmount: optNum(row.actual_statement_amount),
    paidAmount: Number(row.paid_amount ?? 0),
    minimumPayment: optNum(row.minimum_payment),
    status: row.status as CreditCardStatement['status'],
  };
}

// ---- installment plans ----
export function installmentPlanToRow(householdId: HouseholdId, p: InstallmentPlan) {
  return {
    household_id: householdId,
    id: p.id,
    title: p.title,
    principal: p.principal,
    months: p.months,
    annual_interest_rate: p.annualInterestRate,
    fee: p.fee,
    monthly_payment: p.monthlyPayment,
    start_month: p.startMonth,
    paid_months: p.paidMonths,
    remaining_principal: p.remainingPrincipal,
    status: p.status,
  };
}

export function rowToInstallmentPlan(row: Record<string, unknown>): InstallmentPlan {
  return {
    id: String(row.id),
    title: String(row.title),
    principal: Number(row.principal),
    months: Number(row.months),
    annualInterestRate: Number(row.annual_interest_rate ?? 0),
    fee: Number(row.fee ?? 0),
    monthlyPayment: Number(row.monthly_payment ?? 0),
    startMonth: String(row.start_month),
    paidMonths: Number(row.paid_months ?? 0),
    remainingPrincipal: Number(row.remaining_principal ?? 0),
    status: row.status as InstallmentPlan['status'],
  };
}

// ---- savings ----
export function savingsDepositToRow(householdId: HouseholdId, s: SavingsDeposit) {
  return {
    household_id: householdId,
    id: s.id,
    provider: s.provider,
    product_name: s.productName,
    owner_member_id: s.ownerMemberId ?? null,
    opened_at: s.openedAt,
    principal: s.principal,
    annual_interest_rate: s.annualInterestRate,
    term_months: s.termMonths,
    maturity_date: s.maturityDate,
    expected_interest: s.expectedInterest,
    expected_maturity_amount: s.expectedMaturityAmount,
    auto_renew: s.autoRenew,
    status: s.status,
    note: s.note ?? null,
  };
}

export function rowToSavingsDeposit(row: Record<string, unknown>): SavingsDeposit {
  return {
    id: String(row.id),
    provider: String(row.provider),
    productName: String(row.product_name),
    ownerMemberId: optStr(row.owner_member_id),
    openedAt: dateStr(row.opened_at),
    principal: Number(row.principal),
    annualInterestRate: Number(row.annual_interest_rate ?? 0),
    termMonths: Number(row.term_months),
    maturityDate: dateStr(row.maturity_date),
    expectedInterest: Number(row.expected_interest ?? 0),
    expectedMaturityAmount: Number(row.expected_maturity_amount ?? 0),
    autoRenew: Boolean(row.auto_renew),
    status: row.status as SavingsDeposit['status'],
    note: optStr(row.note),
  };
}

// ---- counterparties ----
export function counterpartyToRow(householdId: HouseholdId, c: Counterparty) {
  return {
    household_id: householdId,
    id: c.id,
    name: c.name,
    phone: c.phone ?? null,
    note: c.note ?? null,
  };
}

export function rowToCounterparty(row: Record<string, unknown>): Counterparty {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: optStr(row.phone),
    note: optStr(row.note),
  };
}

// ---- loans ----
export function loanToRow(householdId: HouseholdId, l: Loan) {
  return {
    household_id: householdId,
    id: l.id,
    counterparty_id: l.counterpartyId,
    direction: l.direction,
    principal: l.principal,
    outstanding_principal: l.outstandingPrincipal,
    annual_interest_rate: l.annualInterestRate ?? null,
    expected_due_date: l.expectedDueDate ?? null,
    repayment_priority: l.repaymentPriority ?? null,
    status: l.status,
    note: l.note ?? null,
    created_at: l.createdAt,
  };
}

export function rowToLoan(row: Record<string, unknown>): Loan {
  return {
    id: String(row.id),
    counterpartyId: String(row.counterparty_id),
    direction: row.direction as Loan['direction'],
    principal: Number(row.principal),
    outstandingPrincipal: Number(row.outstanding_principal),
    annualInterestRate: optNum(row.annual_interest_rate),
    expectedDueDate: row.expected_due_date == null ? undefined : dateStr(row.expected_due_date),
    repaymentPriority: optNum(row.repayment_priority),
    status: row.status as Loan['status'],
    note: optStr(row.note),
    createdAt: isoStr(row.created_at),
  };
}

// ---- planned expenses ----
export function plannedExpenseToRow(householdId: HouseholdId, p: PlannedExpense) {
  return {
    household_id: householdId,
    id: p.id,
    title: p.title,
    category_id: p.categoryId ?? null,
    goal_id: p.goalId ?? null,
    event_id: p.eventId ?? null,
    expected_date: p.expectedDate,
    expected_amount: p.expectedAmount,
    priority: p.priority,
    status: p.status,
    note: p.note ?? null,
  };
}

export function rowToPlannedExpense(row: Record<string, unknown>): PlannedExpense {
  return {
    id: String(row.id),
    title: String(row.title),
    categoryId: optStr(row.category_id),
    goalId: optStr(row.goal_id),
    eventId: optStr(row.event_id),
    expectedDate: dateStr(row.expected_date),
    expectedAmount: Number(row.expected_amount ?? 0),
    priority: row.priority as PlannedExpense['priority'],
    status: row.status as PlannedExpense['status'],
    note: optStr(row.note),
  };
}

// ---- goals ----
export function goalToRow(householdId: HouseholdId, g: Goal) {
  return {
    household_id: householdId,
    id: g.id,
    title: g.title,
    goal_type: g.goalType,
    target_amount: g.targetAmount,
    saved_amount: g.savedAmount,
    target_date: g.targetDate ?? null,
    priority: g.priority ?? null,
    status: g.status,
    note: g.note ?? null,
  };
}

export function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    title: String(row.title),
    goalType: row.goal_type as Goal['goalType'],
    targetAmount: Number(row.target_amount ?? 0),
    savedAmount: Number(row.saved_amount ?? 0),
    targetDate: row.target_date == null ? undefined : dateStr(row.target_date),
    priority: optStr(row.priority) as Goal['priority'],
    status: row.status as Goal['status'],
    note: optStr(row.note),
  };
}

// ---- events ----
export function eventToRow(householdId: HouseholdId, e: EventBudget) {
  return {
    household_id: householdId,
    id: e.id,
    name: e.name,
    event_type: e.eventType,
    start_date: e.startDate,
    end_date: e.endDate ?? null,
    budget_amount: e.budgetAmount ?? null,
    status: e.status,
    note: e.note ?? null,
  };
}

export function rowToEvent(row: Record<string, unknown>): EventBudget {
  return {
    id: String(row.id),
    name: String(row.name),
    eventType: row.event_type as EventBudget['eventType'],
    startDate: dateStr(row.start_date),
    endDate: row.end_date == null ? undefined : dateStr(row.end_date),
    budgetAmount: optNum(row.budget_amount),
    status: row.status as EventBudget['status'],
    note: optStr(row.note),
  };
}

// ---- event items ----
export function eventItemToRow(householdId: HouseholdId, i: EventBudgetItem) {
  return {
    household_id: householdId,
    id: i.id,
    event_id: i.eventId,
    title: i.title,
    planned_amount: i.plannedAmount,
    actual_amount: i.actualAmount,
    due_date: i.dueDate ?? null,
    status: i.status,
  };
}

export function rowToEventItem(row: Record<string, unknown>): EventBudgetItem {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    title: String(row.title),
    plannedAmount: Number(row.planned_amount ?? 0),
    actualAmount: Number(row.actual_amount ?? 0),
    dueDate: row.due_date == null ? undefined : dateStr(row.due_date),
    status: row.status as EventBudgetItem['status'],
  };
}

// ---- event contributions ----
export function eventContributionToRow(householdId: HouseholdId, c: EventContribution) {
  return {
    household_id: householdId,
    id: c.id,
    event_id: c.eventId,
    counterparty_id: c.counterpartyId,
    amount: c.amount,
    received_date: c.receivedDate,
    contribution_type: c.contributionType,
    note: c.note ?? null,
  };
}

export function rowToEventContribution(row: Record<string, unknown>): EventContribution {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    counterpartyId: String(row.counterparty_id),
    amount: Number(row.amount ?? 0),
    receivedDate: dateStr(row.received_date),
    contributionType: row.contribution_type as EventContribution['contributionType'],
    note: optStr(row.note),
  };
}

// ---- audit logs ----
export function auditLogToRow(householdId: HouseholdId, a: AuditLog) {
  return {
    household_id: householdId,
    id: a.id,
    entity_type: a.entityType,
    entity_id: a.entityId,
    action: a.action,
    description: a.description,
    user_id: a.userId,
    timestamp: a.timestamp,
  };
}

export function rowToAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    entityType: row.entity_type as AuditLog['entityType'],
    entityId: String(row.entity_id),
    action: row.action as AuditLog['action'],
    description: String(row.description ?? ''),
    userId: String(row.user_id),
    timestamp: isoStr(row.timestamp),
  };
}

// ---- household settings ----
export function householdSettingsToRow(
  householdId: HouseholdId,
  householdName: string,
  currentMemberId: string,
  lastBackupDate?: string
) {
  return {
    household_id: householdId,
    household_name: householdName,
    current_member_id: currentMemberId,
    last_backup_date: lastBackupDate ?? null,
  };
}
