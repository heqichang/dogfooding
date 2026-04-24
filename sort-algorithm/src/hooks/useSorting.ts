import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  SortAlgorithmType,
  SortStep,
  SortStats,
  SortingStatus,
  AnimationSpeed,
  ArrayType,
} from '../types';
import { sortAlgorithms } from '../algorithms';

interface UseSortingOptions {
  algorithm: SortAlgorithmType;
  speed: AnimationSpeed;
}

interface UseSortingReturn {
  array: number[];
  steps: SortStep[];
  currentStepIndex: number;
  status: SortingStatus;
  stats: SortStats;
  generateArray: (length: number, type: ArrayType, customValues?: string) => void;
  startSorting: () => void;
  pauseSorting: () => void;
  stepForward: () => void;
  resetSorting: () => void;
  setAlgorithm: (algorithm: SortAlgorithmType) => void;
  setSpeed: (speed: AnimationSpeed) => void;
}

const speedToMs: Record<AnimationSpeed, number> = {
  slow: 500,
  medium: 200,
  fast: 100,
  extreme: 20,
};

function generateRandomArray(length: number, min = 1, max = 100): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function generateReverseArray(length: number): number[] {
  return Array.from({ length }, (_, i) => length - i);
}

function generateNearlySortedArray(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i + 1);
  const swapCount = Math.floor(length * 0.1);
  for (let i = 0; i < swapCount; i++) {
    const idx1 = Math.floor(Math.random() * length);
    const idx2 = Math.floor(Math.random() * length);
    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
  }
  return arr;
}

export function useSorting({ algorithm, speed }: UseSortingOptions): UseSortingReturn {
  const [array, setArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [status, setStatus] = useState<SortingStatus>('idle');
  const [stats, setStats] = useState<SortStats>({ comparisons: 0, swaps: 0, moves: 0 });
  const [currentAlgorithm, setCurrentAlgorithm] = useState<SortAlgorithmType>(algorithm);
  const [currentSpeed, setCurrentSpeed] = useState<AnimationSpeed>(speed);

  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const isFullSpeed = useRef(false);

  const generateArray = useCallback(
    (length: number, type: ArrayType, customValues?: string) => {
      if (status === 'playing') {
        pauseSorting();
      }

      let newArray: number[];
      switch (type) {
        case 'random':
          newArray = generateRandomArray(length);
          break;
        case 'reverse':
          newArray = generateReverseArray(length);
          break;
        case 'nearly-sorted':
          newArray = generateNearlySortedArray(length);
          break;
        case 'custom':
          newArray = customValues
            ? customValues
                .split(',')
                .map((s) => parseInt(s.trim(), 10))
                .filter((n) => !isNaN(n))
            : generateRandomArray(length);
          break;
        default:
          newArray = generateRandomArray(length);
      }

      setArray(newArray);
      setSteps([]);
      setCurrentStepIndex(0);
      setStatus('idle');
      setStats({ comparisons: 0, swaps: 0, moves: 0 });
    },
    [status]
  );

  const startSorting = useCallback(() => {
    if (status === 'finished') return;

    if (steps.length === 0) {
      const sortFunction = sortAlgorithms[currentAlgorithm];
      const newSteps = sortFunction([...array]);
      setSteps(newSteps);
      setCurrentStepIndex(0);
    }

    setStatus('playing');
    setStats((prev) => ({ ...prev, startTime: prev.startTime || Date.now() }));
  }, [status, steps, currentAlgorithm, array]);

  const pauseSorting = useCallback(() => {
    setStatus('paused');
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const stepForward = useCallback(() => {
    if (status === 'finished') return;

    if (steps.length === 0) {
      const sortFunction = sortAlgorithms[currentAlgorithm];
      const newSteps = sortFunction([...array]);
      setSteps(newSteps);
      if (newSteps.length > 1) {
        setCurrentStepIndex(1);
        setStats(newSteps[1].stats);
      }
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setStats(steps[nextIndex].stats);
    }
  }, [status, steps, currentAlgorithm, array, currentStepIndex]);

  const resetSorting = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    setSteps([]);
    setCurrentStepIndex(0);
    setStatus('idle');
    setStats({ comparisons: 0, swaps: 0, moves: 0 });
    isFullSpeed.current = false;
  }, []);

  const setAlgorithm = useCallback((algo: SortAlgorithmType) => {
    setCurrentAlgorithm(algo);
  }, []);

  const setSpeed = useCallback((spd: AnimationSpeed) => {
    setCurrentSpeed(spd);
  }, []);

  useEffect(() => {
    if (status !== 'playing' || steps.length === 0) return;

    const animate = () => {
      if (currentStepIndex < steps.length - 1) {
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        setStats(steps[nextIndex].stats);

        if (!isFullSpeed.current) {
          animationRef.current = setTimeout(animate, speedToMs[currentSpeed]);
        } else {
          animationRef.current = setTimeout(animate, 0);
        }
      } else {
        setStats((prev) => ({ ...prev, endTime: Date.now() }));
        setStatus('finished');
      }
    };

    if (isFullSpeed.current) {
      const animateFull = () => {
        let nextIndex = currentStepIndex;
        while (nextIndex < steps.length - 1) {
          nextIndex++;
        }
        setCurrentStepIndex(nextIndex);
        setStats({
          ...steps[nextIndex].stats,
          endTime: Date.now(),
        });
        setStatus('finished');
      };
      animateFull();
    } else {
      animationRef.current = setTimeout(animate, speedToMs[currentSpeed]);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [status, steps, currentStepIndex, currentSpeed]);

  useEffect(() => {
    if (array.length === 0) {
      generateArray(20, 'random');
    }
  }, [generateArray, array.length]);

  return {
    array,
    steps,
    currentStepIndex,
    status,
    stats,
    generateArray,
    startSorting,
    pauseSorting,
    stepForward,
    resetSorting,
    setAlgorithm,
    setSpeed,
  };
}
