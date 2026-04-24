import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

export function shellSort(array: number[]): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;
  const sortedIndices: number[] = [];

  let gap = Math.floor(n / 2);

  while (gap > 0) {
    recorder.addStep({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [...sortedIndices],
      description: `当前间隔: ${gap}，开始分组插入排序`
    });

    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j = i;

      recorder.addStep({
        array: [...arr],
        comparing: [i],
        swapping: [],
        sorted: [...sortedIndices],
        description: `取出元素 ${temp}，准备插入到正确位置`
      });

      while (j >= gap && arr[j - gap] > temp) {
        recorder.recordComparison([j, j - gap]);
        recorder.addStep({
          array: [...arr],
          comparing: [j, j - gap],
          swapping: [],
          sorted: [...sortedIndices],
          description: `比较 ${arr[j - gap]} 和 ${temp}`
        });

        recorder.recordMove();
        arr[j] = arr[j - gap];

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [j, j - gap],
          sorted: [...sortedIndices],
          description: `将 ${arr[j]} 移动到位置 ${j}`
        });

        j -= gap;
      }

      if (arr[j] !== temp) {
        recorder.recordMove();
        arr[j] = temp;
        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [j],
          sorted: [...sortedIndices],
          description: `将 ${temp} 插入到位置 ${j}`
        });
      }
    }

    gap = Math.floor(gap / 2);
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
