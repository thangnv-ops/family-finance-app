/**
 * Smart Auto-Suggestion Rule Engine (Section 10)
 * Evaluates keyword rules in priority order to auto-complete transaction inputs
 */

import { SuggestionRule, TransactionType } from '../types/finance';

export interface SuggestionMatch {
  transactionType?: TransactionType;
  categoryId?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  memberId?: string;
  matchedKeyword?: string;
}

export function evaluateDescription(
  text: string,
  rules: SuggestionRule[],
  currentMemberId?: string
): SuggestionMatch | null {
  if (!text || text.trim().length === 0) return null;

  const normalized = text.toLowerCase().trim();

  // Sort rules by priority (ascending: 1 is higher priority than 9)
  const sortedRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const kw = rule.keyword.toLowerCase().trim();
    let matched = false;

    if (rule.matchType === 'EXACT') {
      matched = normalized === kw;
    } else if (rule.matchType === 'STARTS_WITH') {
      matched = normalized.startsWith(kw);
    } else {
      // CONTAINS
      matched = normalized.includes(kw);
    }

    if (matched) {
      return {
        transactionType: rule.suggestedTransactionType,
        categoryId: rule.suggestedCategoryId,
        sourceAccountId: rule.suggestedSourceAccountId,
        destinationAccountId: rule.suggestedDestinationAccountId,
        memberId: rule.suggestedMemberId || currentMemberId,
        matchedKeyword: rule.keyword,
      };
    }
  }

  // Fallback heuristic rules if no custom rule matched
  if (normalized.includes('hoàn tiền') || normalized.includes('hoàn shopee')) {
    return {
      transactionType: 'REFUND',
      matchedKeyword: 'hoàn',
    };
  }

  if (normalized.includes('lương') || normalized.includes('thưởng') || normalized.includes('thu nhập')) {
    return {
      transactionType: 'INCOME',
      matchedKeyword: 'thu nhập',
    };
  }

  if (normalized.includes('chuyển cho vân') || normalized.includes('chuyển vân')) {
    return {
      transactionType: 'TRANSFER',
      sourceAccountId: 'tk_thang',
      destinationAccountId: 'tk_van',
      memberId: 'thang',
      matchedKeyword: 'chuyển cho vân',
    };
  }

  if (normalized.includes('chuyển cho thắng') || normalized.includes('chuyển thắng')) {
    return {
      transactionType: 'TRANSFER',
      sourceAccountId: 'tk_van',
      destinationAccountId: 'tk_thang',
      memberId: 'van',
      matchedKeyword: 'chuyển cho thắng',
    };
  }

  if (normalized.includes('trả thẻ') || normalized.includes('thanh toán tín dụng')) {
    return {
      transactionType: 'CREDIT_PAYMENT',
      destinationAccountId: 'tin_dung',
      matchedKeyword: 'trả thẻ',
    };
  }

  return null;
}
