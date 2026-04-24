import React from 'react';
import type { SortStep, VisualizationStyle, Theme } from '../../types';
import { BarVisualizer } from './BarVisualizer';

interface VisualizerProps {
  step: SortStep;
  style: VisualizationStyle;
  theme: Theme;
}

export const Visualizer: React.FC<VisualizerProps> = ({ step, style, theme }) => {
  switch (style) {
    case 'bar':
      return <BarVisualizer step={step} theme={theme} />;
    case 'line':
      return <LineVisualizer step={step} theme={theme} />;
    case 'color':
      return <ColorVisualizer step={step} theme={theme} />;
    default:
      return <BarVisualizer step={step} theme={theme} />;
  }
};

const LineVisualizer: React.FC<{ step: SortStep; theme: Theme }> = ({ step, theme }) => {
  const { array, comparing, swapping, sorted, pivot } = step;
  const maxValue = Math.max(...array, 1);

  const getPointColor = (index: number): string => {
    if (swapping.includes(index)) return theme.colors.swapping;
    if (comparing.includes(index)) return theme.colors.comparing;
    if (pivot === index) return theme.colors.pivot;
    if (sorted.includes(index)) return theme.colors.sorted;
    return theme.colors.default;
  };

  return (
    <div className="relative h-64 p-4">
      <svg className="w-full h-full" viewBox={`0 0 ${array.length * 40} 200`}>
        <polyline
          points={array.map((value, index) => 
            `${index * 40 + 20},${200 - (value / maxValue) * 180}`
          ).join(' ')}
          fill="none"
          stroke={theme.colors.default}
          strokeWidth="2"
        />
        {array.map((value, index) => (
          <circle
            key={index}
            cx={index * 40 + 20}
            cy={200 - (value / maxValue) * 180}
            r="6"
            fill={getPointColor(index)}
          />
        ))}
      </svg>
    </div>
  );
};

const ColorVisualizer: React.FC<{ step: SortStep; theme: Theme }> = ({ step, theme }) => {
  const { array, comparing, swapping, sorted, pivot } = step;
  const maxValue = Math.max(...array, 1);

  const getColor = (value: number, index: number): string => {
    if (swapping.includes(index)) return theme.colors.swapping;
    if (comparing.includes(index)) return theme.colors.comparing;
    if (pivot === index) return theme.colors.pivot;
    if (sorted.includes(index)) return theme.colors.sorted;
    
    const ratio = value / maxValue;
    const hue = Math.floor(ratio * 240);
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="flex items-center justify-center gap-0.5 h-64 p-4">
      {array.map((value, index) => (
        <div
          key={index}
          className="flex flex-col items-center"
          style={{
            width: `${Math.max(100 / array.length - 0.5, 2)}%`,
          }}
        >
          <div
            className="w-full rounded transition-all duration-200"
            style={{
              height: '100%',
              backgroundColor: getColor(value, index),
              minHeight: '40px',
            }}
          />
          {array.length <= 20 && (
            <span className="text-xs mt-1 font-mono">{value}</span>
          )}
        </div>
      ))}
    </div>
  );
};
