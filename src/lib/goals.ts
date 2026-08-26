import type { Goal } from '../types/finance';

export function depositIntoGoal(goal: Goal, amount: number): Goal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RangeError('Số tiền nạp phải lớn hơn 0');
  }

  const savedAmount = goal.savedAmount + amount;
  return {
    ...goal,
    savedAmount,
    status: savedAmount >= goal.targetAmount ? 'READY' : 'FUNDING',
  };
}

export function reservedGoalAmount(goals: Goal[]): number {
  return goals
    .filter((goal) => goal.status === 'FUNDING' || goal.status === 'READY')
    .reduce((sum, goal) => sum + goal.savedAmount, 0);
}
