import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  FastForward,
  Gauge,
  Settings,
} from 'lucide-react';
import type {
  PlayMode,
  AnimationSpeed,
  SortingStatus,
  VisualizationStyle,
} from '../../types';

interface ControlPanelProps {
  status: SortingStatus;
  speed: AnimationSpeed;
  playMode: PlayMode;
  visualizationStyle: VisualizationStyle;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: AnimationSpeed) => void;
  onPlayModeChange: (mode: PlayMode) => void;
  onVisualizationStyleChange: (style: VisualizationStyle) => void;
  currentStep: number;
  totalSteps: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  speed,
  playMode,
  visualizationStyle,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onPlayModeChange,
  onVisualizationStyleChange,
  currentStep,
  totalSteps,
}) => {
  const speedOptions: { value: AnimationSpeed; label: string }[] = [
    { value: 'slow', label: '慢' },
    { value: 'medium', label: '中' },
    { value: 'fast', label: '快' },
    { value: 'extreme', label: '极速' },
  ];

  const playModeOptions: { value: PlayMode; label: string }[] = [
    { value: 'step', label: '单步' },
    { value: 'auto', label: '自动' },
    { value: 'full', label: '全速' },
  ];

  const styleOptions: { value: VisualizationStyle; label: string }[] = [
    { value: 'bar', label: '柱状图' },
    { value: 'line', label: '折线图' },
    { value: 'color', label: '色块' },
  ];

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  const displayCurrent = totalSteps > 0 ? currentStep + 1 : 0;
  const displayTotal = totalSteps > 0 ? totalSteps : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          控制面板
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          步骤: {displayCurrent} / {displayTotal}
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          title="重置"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={onStep}
          disabled={status === 'finished'}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="单步前进"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          onClick={status === 'playing' ? onPause : onPlay}
          disabled={status === 'finished'}
          className="p-4 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ring-2 ring-purple-300 dark:ring-purple-800"
          title={status === 'playing' ? '暂停' : '播放'}
        >
          {status === 'playing' ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={() => onPlayModeChange('full')}
          disabled={status === 'finished'}
          className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="全速运行"
        >
          <FastForward className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Gauge className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            动画速度
          </label>
          <div className="flex gap-1 flex-wrap">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSpeedChange(option.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                  speed === option.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">播放模式</label>
          <div className="flex gap-1 flex-wrap">
            {playModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onPlayModeChange(option.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                  playMode === option.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">可视化样式</label>
          <div className="flex gap-1 flex-wrap">
            {styleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onVisualizationStyleChange(option.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                  visualizationStyle === option.value
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
