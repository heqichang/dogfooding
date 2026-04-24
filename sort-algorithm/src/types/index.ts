export type SortAlgorithmType =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'shell'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'counting'
  | 'bucket'
  | 'radix'
  | 'cocktail'
  | 'comb'
  | 'binary-insertion'
  | 'three-way-quick';

export type VisualizationStyle = 'bar' | 'line' | 'color';
export type AnimationSpeed = 'slow' | 'medium' | 'fast' | 'extreme';
export type PlayMode = 'step' | 'auto' | 'full';
export type SortingStatus = 'idle' | 'playing' | 'paused' | 'finished';
export type ArrayType = 'random' | 'reverse' | 'nearly-sorted' | 'custom';

export interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
  stats: SortStats;
  description: string;
  codeLine?: number;
}

export interface SortStats {
  comparisons: number;
  swaps: number;
  moves: number;
  startTime?: number;
  endTime?: number;
}

export interface AlgorithmInfo {
  name: string;
  nameEn: string;
  type: SortAlgorithmType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  improvements: string[];
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: string;
  stable: boolean;
  inPlace: boolean;
  businessUseCases: string[];
  interviewQuestions: string[];
  code: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    default: string;
    comparing: string;
    swapping: string;
    sorted: string;
    pivot: string;
  };
}
