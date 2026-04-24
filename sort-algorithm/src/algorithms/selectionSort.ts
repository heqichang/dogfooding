import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function selectionSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      recorder.recordComparison([minIdx, j]);
      recorder.addStep({
        array: [...arr],
        comparing: [minIdx, j],
        swapping: [],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        description: `比较元素 ${arr[minIdx]} 和 ${arr[j]}，寻找最小值`
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [],
          sorted: Array.from({ length: i }, (_, idx) => idx),
          description: `更新最小值索引为 ${j}，值为 ${arr[j]}`
        });
      }
    }

    if (minIdx !== i) {
      recorder.recordSwap();
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [i, minIdx],
        sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
        description: `将最小值 ${arr[i]} 交换到位置 ${i}`
      });
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
