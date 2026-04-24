import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function countingSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;

  if (n === 0) {
    return recorder.getSteps();
  }

  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min + 1;

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    description: `数据范围: ${min} ~ ${max}，创建计数数组`
  });

  const count = new Array(range).fill(0);
  const output = new Array(n);

  for (let i = 0; i < n; i++) {
    recorder.recordComparison([i]);
    recorder.addStep({
      array: [...arr],
      comparing: [i],
      swapping: [],
      sorted: [],
      description: `统计元素 ${arr[i]} 出现次数`
    });
    count[arr[i] - min]++;
  }

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    description: '计算前缀和，确定元素位置'
  });

  for (let i = 1; i < range; i++) {
    count[i] += count[i - 1];
  }

  for (let i = n - 1; i >= 0; i--) {
    const value = arr[i];
    const pos = count[value - min] - 1;
    
    recorder.recordMove();
    output[pos] = value;
    count[value - min]--;

    recorder.addStep({
      array: [...output],
      comparing: [],
      swapping: [pos],
      sorted: Array.from({ length: n - i }, (_, idx) => idx),
      description: `将 ${value} 放置到位置 ${pos}`
    });
  }

  for (let i = 0; i < n; i++) {
    arr[i] = output[i];
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
