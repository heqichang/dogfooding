import React from 'react';
import type { SortStep, Theme } from '../../types';

interface BarVisualizerProps {
  step: SortStep;
  theme: Theme;
}

export const BarVisualizer: React.FC<BarVisualizerProps> = ({ step, theme }) => {
  const { array, comparing, swapping, sorted, pivot } = step;
  const maxValue = Math.max(...array, 1);
  const minValue = Math.min(...array, 0);
  const valueRange = maxValue - minValue;

  const getBarColor = (index: number): string => {
    if (swapping.includes(index)) return theme.colors.swapping;
    if (comparing.includes(index)) return theme.colors.comparing;
    if (pivot === index) return theme.colors.pivot;
    if (sorted.includes(index)) return theme.colors.sorted;
    return theme.colors.default;
  };

  const getBarHeight = (value: number): number => {
    if (valueRange === 0) return 50;
    const normalized = (value - minValue) / valueRange;
    return Math.max(5, normalized * 95 + 5);
  };

  return (
    <div className="flex items-end justify-center gap-1 h-80 p-4 px-2">
      {array.map((value, index) => {
        const height = getBarHeight(value);
        const isComparing = comparing.includes(index);
        const isSwapping = swapping.includes(index);
        const isPivot = pivot === index;
        const isSorted = sorted.includes(index);

        return (
          <div
            key={index}
            className="relative flex flex-col items-center transition-all duration-200"
            style={{
              width: `${Math.max(100 / array.length - 1, 3)}%`,
            }}
          >
            <div
              className="w-full rounded-t transition-all duration-200 relative flex items-end justify-center overflow-hidden shadow-sm"
              style={{
                height: `${height}%`,
                backgroundColor: getBarColor(index),
                minHeight: '20px',
                transform: isComparing || isSwapping ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isComparing ? '0 0 12px rgba(245, 158, 11, 0.6)' : isSwapping ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none',
              }}
            >
              {height > 25 && (
                <span className="text-white text-xs font-bold font-mono mb-1 drop-shadow-md select-none">
                  {value}
                </span>
              )}
            </div>
            
            <div className="w-full flex justify-center mt-1">
              <span
                className={`text-xs font-mono font-medium transition-colors duration-200 ${
                  isComparing ? 'text-amber-600 dark:text-amber-400' :
                  isSwapping ? 'text-red-600 dark:text-red-400' :
                  isPivot ? 'text-blue-600 dark:text-blue-400' :
                  isSorted ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}
              >
                {value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
