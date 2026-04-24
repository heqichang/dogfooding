import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function threeWayQuickSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [];

  function partition(
    low: number,
    high: number
  ): { lt: number; gt: number; pivot: number } {
    const pivotIdx = low + Math.floor(Math.random() * (high - low + 1));
    const pivot = arr[pivotIdx];

    if (pivotIdx !== low) {
      recorder.recordSwap();
      [arr[low], arr[pivotIdx]] = [arr[pivotIdx], arr[low]];
    }

    recorder.addStep({
      array: [...arr],
      comparing: [low],
      swapping: [],
      sorted: [...sortedIndices],
      pivot: low,
      description: `选择基准元素 ${pivot}`
    });

    let lt = low;
    let gt = high;
    let i = low + 1;

    while (i <= gt) {
      recorder.recordComparison([i, lt]);
      recorder.addStep({
        array: [...arr],
        comparing: [i, lt],
        swapping: [],
        sorted: [...sortedIndices],
        pivot: lt,
        description: `比较 ${arr[i]} 和基准 ${pivot}`
      });

      if (arr[i] < pivot) {
        if (i !== lt) {
          recorder.recordSwap();
          [arr[lt], arr[i]] = [arr[i], arr[lt]];

          recorder.addStep({
            array: [...arr],
            comparing: [],
            swapping: [lt, i],
            sorted: [...sortedIndices],
            pivot: lt + 1,
            description: `${arr[lt]} < ${pivot}，交换到小于区域`
          });
        }
        lt++;
        i++;
      } else if (arr[i] > pivot) {
        recorder.recordSwap();
        [arr[i], arr[gt]] = [arr[gt], arr[i]];

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [i, gt],
          sorted: [...sortedIndices],
          pivot: lt,
          description: `${arr[gt]} > ${pivot}，交换到大于区域`
        });
        gt--;
      } else {
        i++;
        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [],
          sorted: [...sortedIndices],
          pivot: lt,
          description: `${arr[i - 1]} === ${pivot}，保留在等于区域`
        });
      }
    }

    for (let idx = lt; idx <= gt; idx++) {
      if (!sortedIndices.includes(idx)) {
        sortedIndices.push(idx);
      }
    }

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `基准 ${pivot} 的正确区间 [${lt}, ${gt}]`
    });

    return { lt, gt, pivot };
  }

  function quickSortHelper(low: number, high: number): void {
    if (low < high) {
      const { lt, gt } = partition(low, high);
      quickSortHelper(low, lt - 1);
      quickSortHelper(gt + 1, high);
    } else if (low === high && !sortedIndices.includes(low)) {
      sortedIndices.push(low);
    }
  }

  quickSortHelper(0, n - 1);

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: '排序完成'
  });

  return recorder.getSteps();
}
