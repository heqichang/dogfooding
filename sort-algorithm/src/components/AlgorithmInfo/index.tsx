import React from 'react';
import type { AlgorithmInfo } from '../../types';
import { ALGORITHMS } from '../../constants/algorithms';
import { Info, CheckCircle, XCircle, Clock, Database, Award, Target, Lightbulb, Code2 } from 'lucide-react';

interface AlgorithmInfoPanelProps {
  algorithmType: keyof typeof ALGORITHMS;
}

export const AlgorithmInfoPanel: React.FC<AlgorithmInfoPanelProps> = ({ algorithmType }) => {
  const algorithm = ALGORITHMS[algorithmType];

  if (!algorithm) return null;

  const difficultyLabels = {
    beginner: { label: '初级', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' },
    intermediate: { label: '中级', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
    advanced: { label: '高级', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          算法信息
        </h3>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${difficultyLabels[algorithm.difficulty].color}`}>
          {difficultyLabels[algorithm.difficulty].label}
        </span>
      </div>

      <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{algorithm.name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{algorithm.nameEn}</p>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {algorithm.description}
      </p>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-semibold text-green-800 dark:text-green-400">优点</span>
        </div>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          {algorithm.advantages.map((adv, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              {adv}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="font-semibold text-red-800 dark:text-red-400">缺点</span>
        </div>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          {algorithm.disadvantages.map((disadv, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">✗</span>
              {disadv}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          时间复杂度
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border border-green-100 dark:border-green-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">最优</p>
            <p className="font-mono font-bold text-green-700 dark:text-green-400 text-lg">
              {algorithm.timeComplexity.best}
            </p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">平均</p>
            <p className="font-mono font-bold text-yellow-700 dark:text-yellow-400 text-lg">
              {algorithm.timeComplexity.average}
            </p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl border border-red-100 dark:border-red-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">最坏</p>
            <p className="font-mono font-bold text-red-700 dark:text-red-400 text-lg">
              {algorithm.timeComplexity.worst}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Database className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">空间复杂度</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">{algorithm.spaceComplexity}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Award className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">稳定性</span>
            <span className={`font-bold ${algorithm.stable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {algorithm.stable ? '稳定' : '不稳定'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Target className="w-5 h-5 text-orange-500 dark:text-orange-400" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">原地排序</span>
            <span className={`font-bold ${algorithm.inPlace ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {algorithm.inPlace ? '是' : '否'}
            </span>
          </div>
        </div>
      </div>

      {algorithm.improvements.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800/30">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-yellow-800 dark:text-yellow-400">
            <Lightbulb className="w-5 h-5" />
            改进方案
          </h4>
          <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
            {algorithm.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">💡</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
          <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          适用场景
        </h4>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          {algorithm.useCases.map((uc, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              {uc}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
          <Code2 className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          业务场景举例
        </h4>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          {algorithm.businessUseCases.map((uc, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              {uc}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold mb-3 text-orange-600 dark:text-orange-400 flex items-center gap-2">
          <span>💡</span> 常见面试题
        </h4>
        <ul className="text-sm space-y-2">
          {algorithm.interviewQuestions.map((q, idx) => (
            <li key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-gray-700 dark:text-gray-300 border border-orange-100 dark:border-orange-800/30">
              <span className="font-bold text-orange-600 dark:text-orange-400">{idx + 1}.</span> {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
