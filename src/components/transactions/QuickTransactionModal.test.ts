// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickTransactionModal } from './QuickTransactionModal';
import { STRUCTURAL_ACCOUNTS } from '../../lib/storage';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function changeValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype =
    element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value);
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', {
    bubbles: true,
  }));
}

describe('QuickTransactionModal', () => {
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    container?.remove();
    container = undefined;
  });

  it('credits income to TK Vân when that account is selected', async () => {
    const onSaveTransaction = vi.fn();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(QuickTransactionModal, {
          isOpen: true,
          onClose: () => undefined,
          categories: [
            {
              id: 'cat_income',
              name: 'Thu nhập',
              kind: 'INCOME',
              icon: 'Coins',
              color: '#16a34a',
              dailySpend: false,
              isActive: true,
            },
          ],
          accounts: STRUCTURAL_ACCOUNTS,
          members: [],
          rules: [],
          events: [],
          goals: [],
          counterparties: [],
          currentMemberId: 'all',
          onSaveTransaction,
        })
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const incomeButton = buttons.find((button) => button.textContent?.includes('Thu nhập'))!;
    const amountInput = container.querySelector('input[inputmode="numeric"]') as HTMLInputElement;
    const descriptionInput = container.querySelector(
      'input[placeholder^="VD:"]'
    ) as HTMLInputElement;
    const accountSelect = container.querySelector('select') as HTMLSelectElement;

    await act(async () => {
      incomeButton.click();
      changeValue(amountInput, '1000000');
      changeValue(descriptionInput, 'Thu nhập khác');
      changeValue(accountSelect, 'tk_van');
    });

    await act(async () => {
      container!.querySelector('form')!.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );
    });

    expect(onSaveTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionType: 'INCOME',
        memberId: 'van',
        destinationAccountId: 'tk_van',
      })
    );

    await act(async () => root.unmount());
  });
});
