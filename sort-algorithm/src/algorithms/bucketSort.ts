import { StepRecorder } from './StepRecorder';
import type { SortStep } from '../types';

function insertionSortForBucket(arr: number[]): number[] {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}

export function bucketSort(array: number[], bucketSize = 5): SortStep[] {
  const recorder = new StepRecorder(array);
  const arr = [...array];
  const n = arr.length;

  if (n === 0) {
    return recorder.getSteps();
  }

  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  const buckets: number[][] = new Array(bucketCount).fill(null).map(() => []);

  recorder.addStep({
    array: [...arr],
    comparing: [],
    swapping: [],
    sorted: [],
    description: `数据范围: ${min} ~ ${max}，创建 ${bucketCount} 个桶`
  });

  for (let i = 0; i < n; i++) {
    const bucketIndex = Math.floor((arr[i] - min) / bucketSize);
    buckets[bucketIndex].push(arr[i]);

    recorder.addStep({
      array: [...arr],
      comparing: [i],
      swapping: [],
      sorted: [],
      description: `元素 ${arr[i]} 放入桶 ${bucketIndex}`
    });
  }

  let currentIndex = 0;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].length > 0) {
      recorder.addStep({
        array: [...arr],
        comparing: [],
        swapping: [],
        sorted: Array.from({ length: currentIndex }, (_, idx) => idx),
        description: `对桶 ${i} 进行插入排序，桶内容: [${buckets[i].join(', ')}]`
      });

      insertionSortForBucket(buckets[i]);

      for (let j = 0; j < buckets[i].length; j++) {
        arr[currentIndex] = buckets[i][j];
        recorder.recordMove();

        recorder.addStep({
          array: [...arr],
          comparing: [],
          swapping: [currentIndex],
          sorted: Array.from({ length: currentIndex + 1 }, (_, idx) => idx),
          description: `从桶 ${i} 取出 ${arr[currentIndex]} 放入位置 ${currentIndex}`
        });
        currentIndex++;
      }
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
