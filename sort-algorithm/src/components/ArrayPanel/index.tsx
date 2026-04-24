import React, { useState } from 'react';
import { Shuffle, ArrowDownUp, TrendingUp, Type, Sliders } from 'lucide-react';
import type { ArrayType } from '../../types';

interface ArrayPanelProps {
  arrayLength: number;
  arrayType: ArrayType;
  customArray: string;
  onLengthChange: (length: number) => void;
  onTypeChange: (type: ArrayType) => void;
  onCustomArrayChange: (array: string) => void;
  onGenerate: () => void;
  disabled: boolean;
}

export const ArrayPanel: React.FC<ArrayPanelProps> = ({
  arrayLength,
  arrayType,
  customArray,
  onLengthChange,
  onTypeChange,
  onCustomArrayChange,
  onGenerate,
  disabled,
}) => {
  const arrayTypes: { value: ArrayType; label: string; icon: React.ReactNode }[] = [
    { value: 'random', label: '随机', icon: <Shuffle className="w-4 h-4" /> },
    { value: 'reverse', label: '逆序', icon: <ArrowDownUp className="w-4 h-4" /> },
    { value: 'nearly-sorted', label: '近乎有序', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'custom', label: '自定义', icon: <Type className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
        <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        数组设置
      </h3>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          数组长度: <span className="font-bold text-purple-600 dark:text-purple-400">{arrayLength}</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min="5"
            max="50"
            value={arrayLength}
            onChange={(e) => onLengthChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 accent-purple-600 dark:accent-purple-500"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
          <span>5</span>
          <span>50</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">数组类型</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {arrayTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onTypeChange(type.value)}
              disabled={disabled}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                arrayType === type.value
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300 dark:ring-purple-800'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {arrayType === 'custom' && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">自定义数组 (逗号分隔)</label>
          <textarea
            value={customArray}
            onChange={(e) => onCustomArrayChange(e.target.value)}
            disabled={disabled}
            placeholder="例如: 5, 3, 8, 1, 9, 2, 7, 4, 6"
            className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            rows={2}
          />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={disabled}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
      >
        <Shuffle className="w-5 h-5" />
        生成数组
      </button>
    </div>
  );
};
