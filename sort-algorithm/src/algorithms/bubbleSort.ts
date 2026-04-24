import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function bubbleSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      recorder.recordComparison([j, j + 1]);
      recorder.addStep({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: [],
        sorted: Array.from({ length: i }, (_, idx) => n - 1 - idx),
        description: `比较元素 ${arr[j]} 和 ${arr[j + 1]}`
      });

      if (arr[j] > arr[j + 1]) {
        recorder.recordSwap();
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        
        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sorted: Array.from({ length: i }, (_, idx) => n - 1 - idx),
          description: `交换元素 ${arr[j + 1]} 和 ${arr[j]}`
        });
      }
    }
  }

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: '排序完成'
  });

  return recorder.getSteps();
}
