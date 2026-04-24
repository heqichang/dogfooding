import React from 'react';
import type { SortStats, SortingStatus } from '../../types';
import { Activity, GitCompare, GitMerge, Clock } from 'lucide-react';

interface StatsPanelProps {
  stats: SortStats;
  status: SortingStatus;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, status }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'idle':
        return '等待开始';
      case 'playing':
        return '运行中...';
      case 'paused':
        return '已暂停';
      case 'finished':
        return '已完成';
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'idle':
        return 'text-gray-500 dark:text-gray-400';
      case 'playing':
        return 'text-green-500 dark:text-green-400';
      case 'paused':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'finished':
        return 'text-purple-500 dark:text-purple-400';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
        <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        数据统计
      </h3>

      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">状态</span>
        <span className={`font-semibold flex items-center gap-2 ${getStatusColor()}`}>
          <span className={`w-3 h-3 rounded-full ${
            status === 'playing' ? 'bg-green-500 animate-pulse' : 
            status === 'paused' ? 'bg-yellow-500' : 
            status === 'finished' ? 'bg-purple-500' : 'bg-gray-400'
          }`} />
          {getStatusText()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <GitCompare className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">比较次数</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatNumber(stats.comparisons)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
            <GitMerge className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">交换次数</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatNumber(stats.swaps)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">移动次数</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatNumber(stats.moves)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">运行时间</span>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {stats.startTime && stats.endTime
              ? ((stats.endTime - stats.startTime) / 1000).toFixed(2) + 's'
              : '--'}
          </p>
        </div>
      </div>
    </div>
  );
};
