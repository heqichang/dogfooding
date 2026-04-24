import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function quickSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];

  function partition(low: number, high: number, sortedIndices: number[]): number {
    const pivot = arr[high];
    recorder.addStep({
      array: [...arr],
      comparing: [high],
      swapping: [],
      sorted: [...sortedIndices],
      pivot: high,
      description: `选择基准元素 ${pivot}`
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      recorder.recordComparison([j, high]);
      recorder.addStep({
        array: [...arr],
        comparing: [j, high],
        swapping: [],
        sorted: [...sortedIndices],
        pivot: high,
        description: `比较 ${arr[j]} 和基准 ${pivot}`
      });

      if (arr[j] < pivot) {
        i++;
        if (i !== j) {
          recorder.recordSwap();
          [arr[i], arr[j]] = [arr[j], arr[i]];
          recorder.addStep({
            array: [...arr],
            comparing: [],
            swapping: [i, j],
            sorted: [...sortedIndices],
            pivot: high,
            description: `交换 ${arr[i]} 和 ${arr[j]}`
          });
        }
      }
    }

    if (i + 1 !== high) {
      recorder.recordSwap();
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [i + 1, high],
        sorted: [...sortedIndices, i + 1],
        pivot: i + 1,
        description: `将基准 ${pivot} 放到正确位置 ${i + 1}`
      });
    } else {
      sortedIndices.push(high);
    }

    return i + 1;
  }

  function quickSortHelper(low: number, high: number, sortedIndices: number[]): void {
    if (low < high) {
      const pi = partition(low, high, sortedIndices);
      quickSortHelper(low, pi - 1, [...sortedIndices, pi]);
      quickSortHelper(pi + 1, high, [...sortedIndices, pi]);
    } else if (low === high && !sortedIndices.includes(low)) {
      sortedIndices.push(low);
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: [...sortedIndices],
        description: `元素 ${arr[low]} 已在正确位置`
      });
    }
  }

  const sortedIndices: number[] = [];
  quickSortHelper(0, arr.length - 1, sortedIndices);

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: arr.length }, (_, i) => i),
    description: '排序完成'
  });

  return recorder.getSteps();
}
