import type { AlgorithmInfo, SortAlgorithmType } from '../types';

export const ALGORITHMS: Record<SortAlgorithmType, AlgorithmInfo> = {
  'bubble': {
    name: '冒泡排序',
    nameEn: 'Bubble Sort',
    type: 'bubble',
    difficulty: 'beginner',
    description: '重复遍历数组，比较相邻元素并交换它们的位置，将较大的元素"冒泡"到数组末尾。',
    advantages: ['实现简单，易于理解', '空间复杂度为 O(1)', '稳定的排序算法'],
    disadvantages: ['时间复杂度高，平均 O(n²)', '不适用于大规模数据', '交换次数较多'],
    useCases: ['教学演示', '小规模数据排序', '验证排序算法理解'],
    improvements: ['鸡尾酒排序（双向冒泡）', '设置标志位提前终止', '记录最后交换位置'],
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    businessUseCases: ['数据量小且基本有序的场景', '需要稳定排序的业务'],
    interviewQuestions: ['冒泡排序的最优时间复杂度是多少？', '如何优化冒泡排序？', '冒泡排序是稳定排序吗？'],
    code: `function bubbleSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`
  },
  'selection': {
    name: '选择排序',
    nameEn: 'Selection Sort',
    type: 'selection',
    difficulty: 'beginner',
    description: '每次从未排序部分选择最小（或最大）的元素，放到已排序部分的末尾。',
    advantages: ['实现简单', '空间复杂度 O(1)', '适用于小数据量'],
    disadvantages: ['时间复杂度 O(n²)', '不稳定的排序算法', '数据移动次数固定'],
    useCases: ['小规模数据', '需要最小化交换次数的场景'],
    improvements: ['双向选择排序', '使用堆优化选择过程'],
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    businessUseCases: ['数据量小且写入成本高的场景'],
    interviewQuestions: ['选择排序的时间复杂度是多少？', '选择排序是稳定排序吗？', '选择排序的核心思想是什么？'],
    code: `function selectionSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  return arr;
}`
  },
  'insertion': {
    name: '插入排序',
    nameEn: 'Insertion Sort',
    type: 'insertion',
    difficulty: 'beginner',
    description: '将未排序的元素逐个插入到已排序部分的正确位置，类似于打扑克牌时整理手牌。',
    advantages: ['实现简单', '对基本有序的数据效率高', '稳定排序', '空间复杂度 O(1)'],
    disadvantages: ['平均时间复杂度 O(n²)', '不适合大规模数据'],
    useCases: ['基本有序的数据', '小规模数据', '在线排序（数据逐个到来）'],
    improvements: ['二分插入排序', '希尔排序（分组插入）'],
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    businessUseCases: ['数据量小且基本有序的场景', '在线排序需求'],
    interviewQuestions: ['插入排序的最优时间复杂度是多少？', '插入排序适用于什么场景？', '插入排序是稳定排序吗？'],
    code: `function insertionSort(arr: number[]): number[] {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`
  },
  'shell': {
    name: '希尔排序',
    nameEn: 'Shell Sort',
    type: 'shell',
    difficulty: 'intermediate',
    description: '插入排序的改进版，通过将数组分成多个子序列进行插入排序，逐步缩小间隔，最后对整个数组进行插入排序。',
    advantages: ['比插入排序效率高', '实现相对简单', '适用于中等规模数据'],
    disadvantages: ['时间复杂度分析复杂', '不稳定排序', '依赖增量序列选择'],
    useCases: ['中等规模数据排序', '需要比插入排序更好性能的场景'],
    improvements: ['使用更好的增量序列（如 Hibbard、Sedgewick）'],
    timeComplexity: { best: 'O(n log n)', average: 'O(n^(4/3))', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    businessUseCases: ['需要比插入排序更高效但不想用复杂算法的场景'],
    interviewQuestions: ['希尔排序的核心思想是什么？', '希尔排序为什么比插入排序快？', '常见的增量序列有哪些？'],
    code: `function shellSort(arr: number[]): number[] {
  const n = arr.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j: number;
      for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
        arr[j] = arr[j - gap];
      }
      arr[j] = temp;
    }
  }
  return arr;
}`
  },
  'merge': {
    name: '归并排序',
    nameEn: 'Merge Sort',
    type: 'merge',
    difficulty: 'intermediate',
    description: '采用分治思想，将数组分成两半，递归排序后再合并两个有序数组。',
    advantages: ['时间复杂度稳定 O(n log n)', '稳定排序', '适用于大规模数据'],
    disadvantages: ['空间复杂度 O(n)', '需要额外的存储空间'],
    useCases: ['大规模数据排序', '需要稳定排序的场景', '链表排序'],
    improvements: ['非递归实现', '小数据量时切换到插入排序', '原地归并'],
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    stable: true,
    inPlace: false,
    businessUseCases: ['外部排序（数据量超过内存）', '需要稳定排序的大数据场景'],
    interviewQuestions: ['归并排序的时间复杂度是多少？', '归并排序的空间复杂度是多少？', '归并排序是稳定排序吗？'],
    code: `function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  return [...result, ...left.slice(i), ...right.slice(j)];
}`
  },
  'quick': {
    name: '快速排序',
    nameEn: 'Quick Sort',
    type: 'quick',
    difficulty: 'intermediate',
    description: '选择一个基准元素，将数组分成两部分（小于基准和大于基准），递归排序这两部分。',
    advantages: ['平均时间复杂度优秀 O(n log n)', '空间复杂度较低 O(log n)', '缓存友好'],
    disadvantages: ['最坏情况 O(n²)', '不稳定排序', '依赖基准选择'],
    useCases: ['通用排序算法', '大规模数据', '需要原地排序的场景'],
    improvements: ['随机基准', '三数取中', '三路快排', '尾递归优化', '小数据量切换到插入排序'],
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    spaceComplexity: 'O(log n)',
    stable: false,
    inPlace: true,
    businessUseCases: ['大多数需要高效排序的场景', '内存受限场景'],
    interviewQuestions: ['快速排序的平均时间复杂度是多少？', '如何优化快速排序的最坏情况？', '快速排序和归并排序的区别？'],
    code: `function quickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr: number[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`
  },
  'heap': {
    name: '堆排序',
    nameEn: 'Heap Sort',
    type: 'heap',
    difficulty: 'intermediate',
    description: '利用堆这种数据结构，将数组构建成最大堆，然后依次取出堆顶元素并调整堆。',
    advantages: ['时间复杂度稳定 O(n log n)', '空间复杂度 O(1)', '适合找 Top K 元素'],
    disadvantages: ['不稳定排序', '缓存不友好'],
    useCases: ['Top K 问题', '需要原地排序且性能稳定的场景'],
    improvements: ['二叉堆优化', '斐波那契堆'],
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    businessUseCases: ['Top K 元素查询', '优先队列实现'],
    interviewQuestions: ['堆排序的时间复杂度是多少？', '堆排序和快速排序的比较？', '如何用堆实现 Top K 查询？'],
    code: `function heapSort(arr: number[]): number[] {
  const n = arr.length;
  
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }
  
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
  
  return arr;
}

function heapify(arr: number[], n: number, i: number): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  
  if (left < n && arr[left] > arr[largest]) {
    largest = left;
  }
  
  if (right < n && arr[right] > arr[largest]) {
    largest = right;
  }
  
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}`
  },
  'counting': {
    name: '计数排序',
    nameEn: 'Counting Sort',
    type: 'counting',
    difficulty: 'advanced',
    description: '非比较排序，统计每个元素出现的次数，然后根据统计结果将元素放到正确的位置。',
    advantages: ['时间复杂度 O(n + k)', '稳定排序', '适用于整数范围较小的场景'],
    disadvantages: ['空间复杂度高', '只能排序整数', '依赖数据范围'],
    useCases: ['年龄排序', '分数排序', '基数排序的子过程'],
    improvements: ['优化空间使用', '结合其他排序算法'],
    timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)' },
    spaceComplexity: 'O(k)',
    stable: true,
    inPlace: false,
    businessUseCases: ['数据范围已知且较小的场景', '需要线性时间排序的场景'],
    interviewQuestions: ['计数排序的时间复杂度是多少？', '计数排序的适用场景是什么？', 'k 代表什么？'],
    code: `function countingSort(arr: number[]): number[] {
  if (arr.length === 0) return arr;
  
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const countArr = new Array(max - min + 1).fill(0);
  
  for (const num of arr) {
    countArr[num - min]++;
  }
  
  const result: number[] = [];
  for (let i = 0; i < countArr.length; i++) {
    while (countArr[i] > 0) {
      result.push(i + min);
      countArr[i]--;
    }
  }
  
  return result;
}`
  },
  'bucket': {
    name: '桶排序',
    nameEn: 'Bucket Sort',
    type: 'bucket',
    difficulty: 'advanced',
    description: '将元素分配到多个桶中，每个桶单独排序，然后合并所有桶。',
    advantages: ['平均时间复杂度 O(n)', '适用于均匀分布的数据', '稳定排序'],
    disadvantages: ['最坏情况 O(n²)', '空间复杂度高', '依赖数据分布'],
    useCases: ['浮点数排序', '均匀分布的数据', '外部排序'],
    improvements: ['选择合适的桶数量', '桶内使用高效排序算法'],
    timeComplexity: { best: 'O(n)', average: 'O(n + k)', worst: 'O(n²)' },
    spaceComplexity: 'O(n + k)',
    stable: true,
    inPlace: false,
    businessUseCases: ['数据均匀分布且范围已知的场景'],
    interviewQuestions: ['桶排序的平均时间复杂度是多少？', '桶排序的适用场景是什么？', '如何选择桶的数量？'],
    code: `function bucketSort(arr: number[], bucketSize = 5): number[] {
  if (arr.length === 0) return arr;
  
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const bucketCount = Math.floor((max - min) / bucketSize) + 1;
  const buckets: number[][] = new Array(bucketCount).fill(null).map(() => []);
  
  for (const num of arr) {
    const bucketIndex = Math.floor((num - min) / bucketSize);
    buckets[bucketIndex].push(num);
  }
  
  const result: number[] = [];
  for (const bucket of buckets) {
    if (bucket.length > 0) {
      result.push(...insertionSort(bucket));
    }
  }
  
  return result;
}

function insertionSort(arr: number[]): number[] {
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
}`
  },
  'radix': {
    name: '基数排序',
    nameEn: 'Radix Sort',
    type: 'radix',
    difficulty: 'advanced',
    description: '按照低位到高位（或高位到低位）依次对数字进行排序，通常使用计数排序或桶排序作为子过程。',
    advantages: ['时间复杂度稳定 O(d * (n + k))', '稳定排序', '适用于整数和字符串'],
    disadvantages: ['需要额外空间', '只能排序特定类型数据'],
    useCases: ['电话号码排序', '身份证号排序', '字符串排序'],
    improvements: ['基数选择优化', '结合其他排序算法'],
    timeComplexity: { best: 'O(d * (n + k))', average: 'O(d * (n + k))', worst: 'O(d * (n + k))' },
    spaceComplexity: 'O(n + k)',
    stable: true,
    inPlace: false,
    businessUseCases: ['需要按位排序的场景', '整数ID排序'],
    interviewQuestions: ['基数排序的时间复杂度是多少？', '基数排序是稳定排序吗？', 'd 和 k 分别代表什么？'],
    code: `function radixSort(arr: number[]): number[] {
  if (arr.length === 0) return arr;
  
  const max = Math.max(...arr);
  const maxDigits = Math.floor(Math.log10(max)) + 1;
  
  for (let digit = 0; digit < maxDigits; digit++) {
    arr = countingSortByDigit(arr, digit);
  }
  
  return arr;
}

function countingSortByDigit(arr: number[], digit: number): number[] {
  const output = new Array(arr.length).fill(0);
  const count = new Array(10).fill(0);
  const divisor = Math.pow(10, digit);
  
  for (const num of arr) {
    const digitValue = Math.floor(num / divisor) % 10;
    count[digitValue]++;
  }
  
  for (let i = 1; i < 10; i++) {
    count[i] += count[i - 1];
  }
  
  for (let i = arr.length - 1; i >= 0; i--) {
    const digitValue = Math.floor(arr[i] / divisor) % 10;
    output[count[digitValue] - 1] = arr[i];
    count[digitValue]--;
  }
  
  return output;
}`
  },
  'cocktail': {
    name: '鸡尾酒排序',
    nameEn: 'Cocktail Sort',
    type: 'cocktail',
    difficulty: 'intermediate',
    description: '冒泡排序的变种，双向遍历数组，先从左到右将大元素"冒泡"到右边，再从右到左将小元素"冒泡"到左边。',
    advantages: ['对小尾巴数据效率高', '比冒泡排序略快', '实现简单'],
    disadvantages: ['时间复杂度仍为 O(n²)', '实际应用较少'],
    useCases: ['基本有序但有小元素在末尾的场景'],
    improvements: ['记录最后交换位置减少遍历范围'],
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    businessUseCases: ['数据基本有序但存在小尾部元素的场景'],
    interviewQuestions: ['鸡尾酒排序和冒泡排序的区别？', '鸡尾酒排序的优势场景是什么？'],
    code: `function cocktailSort(arr: number[]): number[] {
  const n = arr.length;
  let swapped = true;
  let start = 0;
  let end = n - 1;
  
  while (swapped) {
    swapped = false;
    
    for (let i = start; i < end; i++) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
    }
    
    if (!swapped) break;
    swapped = false;
    end--;
    
    for (let i = end - 1; i >= start; i--) {
      if (arr[i] > arr[i + 1]) {
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
    }
    
    start++;
  }
  
  return arr;
}`
  },
  'comb': {
    name: '梳排序',
    nameEn: 'Comb Sort',
    type: 'comb',
    difficulty: 'intermediate',
    description: '冒泡排序的改进，使用逐渐缩小的间隔比较元素，类似于希尔排序。',
    advantages: ['比冒泡排序快', '实现简单', '空间复杂度 O(1)'],
    disadvantages: ['时间复杂度仍为 O(n²)', '不稳定排序'],
    useCases: ['需要比冒泡排序更快但不想用复杂算法的场景'],
    improvements: ['使用更优的收缩因子'],
    timeComplexity: { best: 'O(n log n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    businessUseCases: ['需要简单高效排序算法的场景'],
    interviewQuestions: ['梳排序和冒泡排序的区别？', '收缩因子通常是多少？'],
    code: `function combSort(arr: number[]): number[] {
  const n = arr.length;
  let gap = n;
  const shrink = 1.3;
  let swapped = false;
  
  while (gap > 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / shrink));
    swapped = false;
    
    for (let i = 0; i + gap < n; i++) {
      if (arr[i] > arr[i + gap]) {
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        swapped = true;
      }
    }
  }
  
  return arr;
}`
  },
  'binary-insertion': {
    name: '二分插入排序',
    nameEn: 'Binary Insertion Sort',
    type: 'binary-insertion',
    difficulty: 'intermediate',
    description: '插入排序的改进，使用二分查找找到插入位置，减少比较次数。',
    advantages: ['比插入排序比较次数少', '稳定排序', '空间复杂度 O(1)'],
    disadvantages: ['移动次数不变', '平均时间复杂度仍为 O(n²)'],
    useCases: ['比较操作代价较大的场景'],
    improvements: ['结合希尔排序思想'],
    timeComplexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    businessUseCases: ['比较操作代价较高的场景'],
    interviewQuestions: ['二分插入排序和普通插入排序的区别？', '二分插入排序减少了什么操作？'],
    code: `function binaryInsertionSort(arr: number[]): number[] {
  const n = arr.length;
  
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    const pos = binarySearch(arr, key, 0, i - 1);
    
    for (let j = i - 1; j >= pos; j--) {
      arr[j + 1] = arr[j];
    }
    
    arr[pos] = key;
  }
  
  return arr;
}

function binarySearch(arr: number[], key: number, low: number, high: number): number {
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === key) return mid;
    else if (arr[mid] < key) low = mid + 1;
    else high = mid - 1;
  }
  return low;
}`
  },
  'three-way-quick': {
    name: '三路快速排序',
    nameEn: 'Three-way Quick Sort',
    type: 'three-way-quick',
    difficulty: 'advanced',
    description: '快速排序的变种，将数组分成三部分：小于基准、等于基准、大于基准，特别适合有大量重复元素的场景。',
    advantages: ['对重复元素效率高', '减少递归次数', '比普通快排更稳定'],
    disadvantages: ['实现稍复杂', '最坏情况仍为 O(n²)'],
    useCases: ['有大量重复元素的数据', '荷兰国旗问题'],
    improvements: ['随机基准', '三数取中'],
    timeComplexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n²)' },
    spaceComplexity: 'O(log n)',
    stable: false,
    inPlace: true,
    businessUseCases: ['包含大量重复元素的数据排序'],
    interviewQuestions: ['三路快排和普通快排的区别？', '三路快排适用于什么场景？'],
    code: `function threeWayQuickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
  if (low >= high) return arr;
  
  const pivot = arr[low + Math.floor(Math.random() * (high - low + 1))];
  let lt = low;
  let i = low;
  let gt = high;
  
  while (i <= gt) {
    if (arr[i] < pivot) {
      [arr[i], arr[lt]] = [arr[lt], arr[i]];
      lt++;
      i++;
    } else if (arr[i] > pivot) {
      [arr[i], arr[gt]] = [arr[gt], arr[i]];
      gt--;
    } else {
      i++;
    }
  }
  
  threeWayQuickSort(arr, low, lt - 1);
  threeWayQuickSort(arr, gt + 1, high);
  
  return arr;
}`
  }
};

export const ALGORITHM_LIST = Object.values(ALGORITHMS);
