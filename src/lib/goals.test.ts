import { describe, expect, it } from 'vitest';
import type { Goal } from '../types/finance';
import { depositIntoGoal, reservedGoalAmount } from './goals';

const goal: Goal = {
  id: 'goal_1',
  title: 'Robot hút bụi',
  goalType: 'PURCHASE',
  targetAmount: 10_000_000,
  savedAmount: 4_000_000,
  status: 'PLANNING',
};

describe('depositIntoGoal', () => {
  it('adds a positive deposit and starts funding the goal', () => {
    expect(depositIntoGoal(goal, 2_000_000)).toMatchObject({
      savedAmount: 6_000_000,
      status: 'FUNDING',
    });
  });

  it('marks a fully funded goal as ready', () => {
    expect(depositIntoGoal(goal, 6_000_000)).toMatchObject({
      savedAmount: 10_000_000,
      status: 'READY',
    });
  });

  it('rejects zero and invalid deposits', () => {
    expect(() => depositIntoGoal(goal, 0)).toThrow('Số tiền nạp phải lớn hơn 0');
    expect(() => depositIntoGoal(goal, Number.NaN)).toThrow('Số tiền nạp phải lớn hơn 0');
  });
});

describe('reservedGoalAmount', () => {
  it('reserves saved money only while a goal is being funded or ready', () => {
    expect(
      reservedGoalAmount([
        { ...goal, savedAmount: 4_000_000, status: 'FUNDING' },
        { ...goal, id: 'goal_2', savedAmount: 6_000_000, status: 'READY' },
        { ...goal, id: 'goal_3', savedAmount: 2_000_000, status: 'DONE' },
      ])
    ).toBe(10_000_000);
  });
});
