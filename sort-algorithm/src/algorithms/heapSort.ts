import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function heapSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [];

  function heapify(size: number, i: number): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < size) {
      recorder.recordComparison([largest, left]);
      recorder.addStep({
        array: [...arr],
        comparing: [largest, left],
        swapping: [],
        sorted: [...sortedIndices],
        description: `比较父节点 ${arr[largest]} 和左子节点 ${arr[left]}`
      });

      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }

    if (right < size) {
      recorder.recordComparison([largest, right]);
      recorder.addStep({
        array: [...arr],
        comparing: [largest, right],
        swapping: [],
        sorted: [...sortedIndices],
        description: `比较父节点 ${arr[largest]} 和右子节点 ${arr[right]}`
      });

      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    if (largest !== i) {
      recorder.recordSwap();
      [arr[i], arr[largest]] = [arr[largest], arr[i]];

      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [i, largest],
        sorted: [...sortedIndices],
        description: `交换 ${arr[largest]} 和 ${arr[i]}`
      });

      heapify(size, largest);
    }
  }

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    description: '开始构建最大堆'
  });

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    description: '最大堆构建完成，开始排序'
  });

  for (let i = n - 1; i > 0; i--) {
    recorder.recordSwap();
    [arr[0], arr[i]] = [arr[i], arr[0]];

    sortedIndices.push(i);
    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [0, i],
      sorted: [...sortedIndices],
      description: `交换堆顶 ${arr[0]} 到位置 ${i}，已排序区域增加`
    });

    heapify(i, 0);
  }

  sortedIndices.push(0);
  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: '排序完成'
  });

  return recorder.getSteps();
}
