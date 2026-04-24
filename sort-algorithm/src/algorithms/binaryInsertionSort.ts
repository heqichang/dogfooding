import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

function binarySearch(
  arr: number[],
  key: number,
  low: number,
  high: number
): number {
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === key) return mid;
    else if (arr[mid] < key) low = mid + 1;
    else high = mid - 1;
  }
  return low;
}

export function binaryInsertionSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [0];

  for (let i = 1; i < n; i++) {
    const key = arr[i];

    recorder.addStep({
      array: [...arr],
      comparing: [i],
      swapping: [],
      sorted: [...sortedIndices],
      description: `取出元素 ${key}，准备二分查找插入位置`
    });

    let low = 0;
    let high = i - 1;
    let pos = i;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      recorder.recordComparison([mid, i]);

      recorder.addStep({
        array: [...arr],
        comparing: [mid, i],
        swapping: [],
        sorted: [...sortedIndices],
        description: `二分查找：中间位置 ${mid}，值 ${arr[mid]}，与 ${key} 比较`
      });

      if (arr[mid] === key) {
        pos = mid;
        break;
      } else if (arr[mid] < key) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (low > high) {
      pos = low;
    }

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `找到插入位置 ${pos}`
    });

    if (pos !== i) {
      for (let j = i - 1; j >= pos; j--) {
        recorder.recordMove();
        arr[j + 1] = arr[j];

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sortedIndices],
          description: `将 ${arr[j]} 移动到位置 ${j + 1}`
        });
      }

      arr[pos] = key;
      recorder.recordMove();
    }

    sortedIndices.length = 0;
    for (let idx = 0; idx <= i; idx++) {
      sortedIndices.push(idx);
    }

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `将 ${key} 插入到位置 ${pos}`
    });
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
