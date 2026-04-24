import React from 'react';
import type { AlgorithmInfo, SortAlgorithmType } from '../../types';
import { ALGORITHMS } from '../../constants/algorithms';
import { BookOpen, BarChart3, Zap } from 'lucide-react';

interface AlgorithmSelectorProps {
  selectedAlgorithm: SortAlgorithmType;
  onAlgorithmSelect: (algorithm: SortAlgorithmType) => void;
  disabled: boolean;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const difficultyLabels = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  selectedAlgorithm,
  onAlgorithmSelect,
  disabled,
}) => {
  const algorithms = Object.values(ALGORITHMS);
  const beginnerAlgos = algorithms.filter((a) => a.difficulty === 'beginner');
  const intermediateAlgos = algorithms.filter((a) => a.difficulty === 'intermediate');
  const advancedAlgos = algorithms.filter((a) => a.difficulty === 'advanced');

  const renderAlgorithmCard = (algo: AlgorithmInfo) => (
    <button
      key={algo.type}
      onClick={() => onAlgorithmSelect(algo.type)}
      disabled={disabled}
      className={`p-3 rounded-lg text-left transition-all duration-200 ${
        selectedAlgorithm === algo.type
          ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 text-gray-900 dark:text-gray-100'
      } disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 dark:border-gray-600/50`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">{algo.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          selectedAlgorithm === algo.type
            ? 'bg-purple-500/80 text-white'
            : difficultyColors[algo.difficulty]
        }`}>
          {difficultyLabels[algo.difficulty]}
        </span>
      </div>
      <p className={`text-xs ${
        selectedAlgorithm === algo.type ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {algo.nameEn}
      </p>
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        选择算法
      </h3>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
            基础排序
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {beginnerAlgos.map(renderAlgorithmCard)}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            进阶排序 (面试高频)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {intermediateAlgos.map(renderAlgorithmCard)}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
            高级 / 特殊排序
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {advancedAlgos.map(renderAlgorithmCard)}
          </div>
        </div>
      </div>
    </div>
  );
};
