import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function combSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [];

  let gap = n;
  const shrink = 1.3;
  let swapped = false;

  while (gap > 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / shrink));
    swapped = false;

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `当前间隔: ${gap}，开始比较交换`
    });

    for (let i = 0; i + gap < n; i++) {
      recorder.recordComparison([i, i + gap]);
      recorder.addStep({
        array: [...arr],
        comparing: [i, i + gap],
        swapping: [],
        sorted: [...sortedIndices],
        description: `比较位置 ${i} 和 ${i + gap} 的元素 ${arr[i]} 和 ${arr[i + gap]}`
      });

      if (arr[i] > arr[i + gap]) {
        recorder.recordSwap();
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        swapped = true;

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [i, i + gap],
          sorted: [...sortedIndices],
          description: `交换 ${arr[i + gap]} 和 ${arr[i]}`
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
