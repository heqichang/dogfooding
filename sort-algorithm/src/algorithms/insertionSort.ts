import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function insertionSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;

    recorder.addStep({
      array: [...arr],
      comparing: [i],
      swapping: [],
      sorted: Array.from({ length: i }, (_, idx) => idx),
      description: `取出元素 ${key}，准备插入到已排序部分`
    });

    while (j >= 0 && arr[j] > key) {
      recorder.recordComparison([j, j + 1]);
      recorder.addStep({
        array: [...arr],
        comparing: [j, j + 1],
        swapping: [],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        description: `比较 ${arr[j]} 和 ${key}`
      });

      recorder.recordMove();
      arr[j + 1] = arr[j];

      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [j, j + 1],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        description: `将 ${arr[j + 1]} 向后移动`
      });

      j--;
    }

    arr[j + 1] = key;
    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
      description: `将 ${key} 插入到位置 ${j + 1}`
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
