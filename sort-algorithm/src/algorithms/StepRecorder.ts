import type { SortStep, SortStats } from '../types';

export class StepRecorder {
  private steps: SortStep[] = [];
  private stats: SortStats = {
    comparisons: 0,
    swaps: 0,
    moves: 0
  };
  private originalArray: number[] = [];

  constructor(array: number[]) {
    this.originalArray = [...array];
    this.addStep({
      array: [...array],
      comparing: [],
      swapping: [],
      sorted: [],
      stats: { ...this.stats },
      description: '初始化数组'
    });
  }

  addStep(step: Omit<SortStep, 'stats'> & { stats?: SortStats }): void {
    this.steps.push({
      ...step,
      stats: step.stats || { ...this.stats }
    });
  }

  recordComparison(indices: number[]): void {
    this.stats.comparisons++;
  }

  recordSwap(): void {
    this.stats.swaps++;
  }

  recordMove(): void {
    this.stats.moves++;
  }

  getStats(): SortStats {
    return { ...this.stats };
  }

  getSteps(): SortStep[] {
    return this.steps;
  }

  getStepCount(): number {
    return this.steps.length;
  }

  getOriginalArray(): number[] {
    return [...this.originalArray];
  }
}
