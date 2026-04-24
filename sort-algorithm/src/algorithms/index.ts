import type { SortAlgorithmType, SortStep } from '../types';
import { bubbleSort } from './bubbleSort';
import { selectionSort } from './selectionSort';
import { insertionSort } from './insertionSort';
import { shellSort } from './shellSort';
import { mergeSort } from './mergeSort';
import { quickSort } from './quickSort';
import { heapSort } from './heapSort';
import { countingSort } from './countingSort';
import { bucketSort } from './bucketSort';
import { radixSort } from './radixSort';
import { cocktailSort } from './cocktailSort';
import { combSort } from './combSort';
import { binaryInsertionSort } from './binaryInsertionSort';
import { threeWayQuickSort } from './threeWayQuickSort';

export { StepRecorder } from './StepRecorder';
export { bubbleSort } from './bubbleSort';
export { selectionSort } from './selectionSort';
export { insertionSort } from './insertionSort';
export { shellSort } from './shellSort';
export { mergeSort } from './mergeSort';
export { quickSort } from './quickSort';
export { heapSort } from './heapSort';
export { countingSort } from './countingSort';
export { bucketSort } from './bucketSort';
export { radixSort } from './radixSort';
export { cocktailSort } from './cocktailSort';
export { combSort } from './combSort';
export { binaryInsertionSort } from './binaryInsertionSort';
export { threeWayQuickSort } from './threeWayQuickSort';

export const sortAlgorithms: Record<SortAlgorithmType, (arr: number[]) => SortStep[]> = {
  'bubble': bubbleSort,
  'selection': selectionSort,
  'insertion': insertionSort,
  'shell': shellSort,
  'merge': mergeSort,
  'quick': quickSort,
  'heap': heapSort,
  'counting': countingSort,
  'bucket': bucketSort,
  'radix': radixSort,
  'cocktail': cocktailSort,
  'comb': combSort,
  'binary-insertion': binaryInsertionSort,
  'three-way-quick': threeWayQuickSort,
};

export function getSortAlgorithm(type: SortAlgorithmType): (arr: number[]) => SortStep[] {
  return sortAlgorithms[type];
}
