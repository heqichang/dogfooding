import React, { useState, useEffect, useCallback } from 'react';
import type {
  SortAlgorithmType,
  AnimationSpeed,
  PlayMode,
  VisualizationStyle,
  ArrayType,
  SortStep,
} from './types';
import { useSorting } from './hooks/useSorting';
import { useTheme } from './contexts/ThemeContext';
import { Visualizer } from './components/Visualizer';
import { ControlPanel } from './components/ControlPanel';
import { ArrayPanel } from './components/ArrayPanel';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { StatsPanel } from './components/StatsPanel';
import { AlgorithmInfoPanel } from './components/AlgorithmInfo';
import { CodeViewer } from './components/CodeViewer';
import { Sun, Moon, BarChart3, BookOpen, Code2, Shuffle, Info } from 'lucide-react';

type ActiveTab = 'visualize' | 'info' | 'code';

function App() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<SortAlgorithmType>('bubble');
  const [speed, setSpeed] = useState<AnimationSpeed>('medium');
  const [playMode, setPlayMode] = useState<PlayMode>('auto');
  const [visualizationStyle, setVisualizationStyle] = useState<VisualizationStyle>('bar');
  const [arrayLength, setArrayLength] = useState(12);
  const [arrayType, setArrayType] = useState<ArrayType>('random');
  const [customArray, setCustomArray] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('visualize');
  const [showInfo, setShowInfo] = useState(false);

  const {
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
    setSpeed: setSortingSpeed,
  } = useSorting({
    algorithm: selectedAlgorithm,
    speed,
  });

  const currentStep: SortStep = steps.length > 0 
    ? steps[currentStepIndex] 
    : {
        array,
        comparing: [],
        swapping: [],
        sorted: [],
        stats: { comparisons: 0, swaps: 0, moves: 0 },
        description: '等待生成数组并开始排序',
      };

  const handleAlgorithmSelect = useCallback((algorithm: SortAlgorithmType) => {
    setSelectedAlgorithm(algorithm);
    setAlgorithm(algorithm);
    resetSorting();
  }, [setAlgorithm, resetSorting]);

  const handleGenerateArray = useCallback(() => {
    generateArray(arrayLength, arrayType, customArray);
  }, [generateArray, arrayLength, arrayType, customArray]);

  const handlePlay = useCallback(() => {
    startSorting();
  }, [startSorting]);

  const handlePause = useCallback(() => {
    pauseSorting();
  }, [pauseSorting]);

  const handleStep = useCallback(() => {
    stepForward();
  }, [stepForward]);

  const handleReset = useCallback(() => {
    resetSorting();
  }, [resetSorting]);

  const handleSpeedChange = useCallback((newSpeed: AnimationSpeed) => {
    setSpeed(newSpeed);
    setSortingSpeed(newSpeed);
  }, [setSortingSpeed]);

  const handlePlayModeChange = useCallback((mode: PlayMode) => {
    setPlayMode(mode);
  }, []);

  const handleVisualizationStyleChange = useCallback((style: VisualizationStyle) => {
    setVisualizationStyle(style);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (status === 'playing') {
            handlePause();
          } else {
            handlePlay();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleStep();
          break;
        case 'KeyR':
          e.preventDefault();
          handleReset();
          break;
        case 'KeyS':
          e.preventDefault();
          if (speed === 'slow') {
            handleSpeedChange('medium');
          } else if (speed === 'medium') {
            handleSpeedChange('fast');
          } else if (speed === 'fast') {
            handleSpeedChange('extreme');
          }
          break;
        case 'KeyF':
          e.preventDefault();
          if (speed === 'extreme') {
            handleSpeedChange('fast');
          } else if (speed === 'fast') {
            handleSpeedChange('medium');
          } else if (speed === 'medium') {
            handleSpeedChange('slow');
          }
          break;
        case 'Digit1':
          handleAlgorithmSelect('bubble');
          break;
        case 'Digit2':
          handleAlgorithmSelect('selection');
          break;
        case 'Digit3':
          handleAlgorithmSelect('insertion');
          break;
        case 'Digit4':
          handleAlgorithmSelect('shell');
          break;
        case 'Digit5':
          handleAlgorithmSelect('merge');
          break;
        case 'Digit6':
          handleAlgorithmSelect('quick');
          break;
        case 'Digit7':
          handleAlgorithmSelect('heap');
          break;
        case 'Digit8':
          handleAlgorithmSelect('counting');
          break;
        case 'Digit9':
          handleAlgorithmSelect('bucket');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    status,
    speed,
    handlePlay,
    handlePause,
    handleStep,
    handleReset,
    handleSpeedChange,
    handleAlgorithmSelect,
  ]);

  const isSortingActive = status === 'playing';

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">排序算法可视化</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">交互式排序算法学习平台</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                title="快捷键说明"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                title={isDark ? '切换到浅色模式' : '切换到深色模式'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {showInfo && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <h4 className="font-semibold text-sm mb-2 text-yellow-800 dark:text-yellow-300">⌨️ 键盘快捷键</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-700 dark:text-gray-300">
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">空格</kbd> 播放/暂停</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">→</kbd> 单步前进</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">R</kbd> 重置</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">1-9</kbd> 切换算法</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">S</kbd> 加速</span>
              <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">F</kbd> 减速</span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <AlgorithmSelector
              selectedAlgorithm={selectedAlgorithm}
              onAlgorithmSelect={handleAlgorithmSelect}
              disabled={isSortingActive}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <button
                  onClick={() => setActiveTab('visualize')}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'visualize'
                      ? 'bg-purple-600 text-white shadow-inner'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  可视化
                </button>
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'info'
                      ? 'bg-purple-600 text-white shadow-inner'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  算法信息
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'code'
                      ? 'bg-purple-600 text-white shadow-inner'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  源代码
                </button>
              </div>

              <div className="p-4">
                {activeTab === 'visualize' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Visualizer
                        step={currentStep}
                        style={visualizationStyle}
                        theme={theme}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.default }}></span>
                        <span>未排序</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.comparing }}></span>
                        <span>比较中</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.swapping }}></span>
                        <span>交换中</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.sorted }}></span>
                        <span>已排序</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.pivot }}></span>
                        <span>基准</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-center text-gray-700 dark:text-gray-300 font-medium">{currentStep.description}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'info' && (
                  <AlgorithmInfoPanel algorithmType={selectedAlgorithm} />
                )}

                {activeTab === 'code' && (
                  <CodeViewer
                    algorithmType={selectedAlgorithm}
                    isDark={isDark}
                    currentCodeLine={currentStep.codeLine}
                  />
                )}
              </div>
            </div>

            <ControlPanel
              status={status}
              speed={speed}
              playMode={playMode}
              visualizationStyle={visualizationStyle}
              onPlay={handlePlay}
              onPause={handlePause}
              onStep={handleStep}
              onReset={handleReset}
              onSpeedChange={handleSpeedChange}
              onPlayModeChange={handlePlayModeChange}
              onVisualizationStyleChange={handleVisualizationStyleChange}
              currentStep={currentStepIndex}
              totalSteps={steps.length}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <ArrayPanel
              arrayLength={arrayLength}
              arrayType={arrayType}
              customArray={customArray}
              onLengthChange={setArrayLength}
              onTypeChange={setArrayType}
              onCustomArrayChange={setCustomArray}
              onGenerate={handleGenerateArray}
              disabled={isSortingActive}
            />

            <StatsPanel stats={stats} status={status} />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                学习提示
              </h3>
              <ul className="text-sm space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  建议从基础排序开始学习，逐步过渡到进阶算法
                </li>
                <li className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  单步执行可以更好地理解算法的每一步操作
                </li>
                <li className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  对比不同数据分布（随机、逆序、近乎有序）下的算法表现
                </li>
                <li className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  注意观察比较次数和交换次数的变化
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            排序算法可视化学习平台 · 帮助程序员直观理解排序算法原理
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
