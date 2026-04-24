import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function radixSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;

  if (n === 0) {
    return recorder.getSteps();
  }

  const max = Math.max(...arr);
  const maxDigits = Math.floor(Math.log10(max)) + 1;

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    description: `最大值: ${max}，最大位数: ${maxDigits}`
  });

  function countingSortByDigit(digit: number): void {
    const output = new Array(n);
    const count = new Array(10).fill(0);
    const divisor = Math.pow(10, digit);

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [],
      description: `按第 ${digit + 1} 位 (10^${digit}) 排序`
    });

    for (let i = 0; i < n; i++) {
      const digitValue = Math.floor(arr[i] / divisor) % 10;
      recorder.recordComparison([i]);
      count[digitValue]++;
    }

    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }

    for (let i = n - 1; i >= 0; i--) {
      const digitValue = Math.floor(arr[i] / divisor) % 10;
      const pos = count[digitValue] - 1;
      
      recorder.recordMove();
      output[pos] = arr[i];
      count[digitValue]--;

      recorder.addStep({
        array: [...output],
        comparing: [],
        swapping: [pos],
        sorted: [],
        description: `将 ${arr[i]} (第${digit + 1}位: ${digitValue}) 放置到位置 ${pos}`
      });
    }

    for (let i = 0; i < n; i++) {
      arr[i] = output[i];
    }

    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [],
      description: `第 ${digit + 1} 位排序完成`
    });
  }

  for (let digit = 0; digit < maxDigits; digit++) {
    countingSortByDigit(digit);
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
