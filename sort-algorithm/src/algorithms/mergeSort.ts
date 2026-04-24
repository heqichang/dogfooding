import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function mergeSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [];

  function merge(left: number, mid: number, right: number): void {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `合并区间 [${left}, ${mid}] 和 [${mid + 1}, ${right}]`
    });

    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
      recorder.recordComparison([left + i, mid + 1 + j]);
      recorder.addStep({
        array: [...arr],
        comparing: [left + i, mid + 1 + j],
        swapping: [],
        sorted: [...sortedIndices],
        description: `比较 ${leftArr[i]} 和 ${rightArr[j]}`
      });

      if (leftArr[i] <= rightArr[j]) {
        if (arr[k] !== leftArr[i]) {
          recorder.recordMove();
        }
        arr[k] = leftArr[i];
        i++;
      } else {
        if (arr[k] !== rightArr[j]) {
          recorder.recordMove();
        }
        arr[k] = rightArr[j];
        j++;
      }

      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [k],
        sorted: [...sortedIndices],
        description: `放置元素 ${arr[k]} 到位置 ${k}`
      });
      k++;
    }

    while (i < leftArr.length) {
      if (arr[k] !== leftArr[i]) {
        recorder.recordMove();
      }
      arr[k] = leftArr[i];
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [k],
        sorted: [...sortedIndices],
        description: `复制剩余左半元素 ${arr[k]} 到位置 ${k}`
      });
      i++;
      k++;
    }

    while (j < rightArr.length) {
      if (arr[k] !== rightArr[j]) {
        recorder.recordMove();
      }
      arr[k] = rightArr[j];
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [k],
        sorted: [...sortedIndices],
        description: `复制剩余右半元素 ${arr[k]} 到位置 ${k}`
      });
      j++;
      k++;
    }

    for (let idx = left; idx <= right; idx++) {
      if (!sortedIndices.includes(idx)) {
        sortedIndices.push(idx);
      }
    }
  }

  function mergeSortHelper(left: number, right: number): void {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: [...sortedIndices],
        description: `拆分区间 [${left}, ${right}] 为 [${left}, ${mid}] 和 [${mid + 1}, ${right}]`
      });

      mergeSortHelper(left, mid);
      mergeSortHelper(mid + 1, right);
      merge(left, mid, right);
    }
  }

  mergeSortHelper(0, n - 1);

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: '排序完成'
  });

  return recorder.getSteps();
}
