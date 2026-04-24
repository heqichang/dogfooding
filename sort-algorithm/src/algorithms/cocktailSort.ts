import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function cocktailSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [];

  let swapped = true;
  let start = 0;
  let end = n - 1;

  while (swapped) {
    swapped = false;

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `从左到右冒泡，范围 [${start}, ${end}]`
    });

    for (let i = start; i < end; i++) {
      recorder.recordComparison([i, i + 1]);
      recorder.addStep({
        array: [...arr],
        comparing: [i, i + 1],
        swapping: [],
        sorted: [...sortedIndices],
        description: `比较 ${arr[i]} 和 ${arr[i + 1]}`
      });

      if (arr[i] > arr[i + 1]) {
        recorder.recordSwap();
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [i, i + 1],
          sorted: [...sortedIndices],
          description: `交换 ${arr[i + 1]} 和 ${arr[i]}`
        });
      }
    }

    if (!swapped) break;

    sortedIndices.push(end);
    end--;
    swapped = false;

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `从右到左冒泡，范围 [${start}, ${end}]`
    });

    for (let i = end - 1; i >= start; i--) {
      recorder.recordComparison([i, i + 1]);
      recorder.addStep({
        array: [...arr],
        comparing: [i, i + 1],
        swapping: [],
        sorted: [...sortedIndices],
        description: `比较 ${arr[i]} 和 ${arr[i + 1]}`
      });

      if (arr[i] > arr[i + 1]) {
        recorder.recordSwap();
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [i, i + 1],
          sorted: [...sortedIndices],
          description: `交换 ${arr[i + 1]} 和 ${arr[i]}`
        });
      }
    }

    sortedIndices.push(start);
    start++;
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
