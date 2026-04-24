import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Code2 } from 'lucide-react';
import type { SortAlgorithmType } from '../../types';
import { ALGORITHMS } from '../../constants/algorithms';

interface CodeViewerProps {
  algorithmType: SortAlgorithmType;
  isDark: boolean;
  currentCodeLine?: number;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  algorithmType,
  isDark,
  currentCodeLine,
}) => {
  const [copied, setCopied] = useState(false);
  const algorithm = ALGORITHMS[algorithmType];

  if (!algorithm) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(algorithm.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineStyle = (lineNumber: number) => ({
    backgroundColor: currentCodeLine === lineNumber
      ? isDark ? 'rgba(147, 51, 234, 0.25)' : 'rgba(147, 51, 234, 0.15)'
      : 'transparent',
    display: 'block',
    width: '100%',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          源代码 (TypeScript)
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-all duration-200 text-gray-700 dark:text-gray-200 font-medium"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              复制代码
            </>
          )}
        </button>
      </div>

      <div className="relative overflow-auto">
        <SyntaxHighlighter
          language="typescript"
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            maxHeight: '500px',
            overflow: 'auto',
            borderRadius: 0,
            backgroundColor: isDark ? '#1e1e1e' : '#fafafa',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            wordBreak: 'break-all',
          }}
          showLineNumbers
          wrapLines
          useInlineStyles
          lineNumberStyle={{
            minWidth: '2.5rem',
            paddingRight: '1rem',
            color: isDark ? '#6b7280' : '#9ca3af',
            userSelect: 'none',
            textAlign: 'right',
            fontWeight: '500',
          }}
          lineProps={(lineNumber) => ({
            style: lineStyle(lineNumber),
            className: 'hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors',
          })}
          PreTag="div"
          CodeTag="code"
        >
          {algorithm.code}
        </SyntaxHighlighter>
      </div>

      {currentCodeLine && (
        <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800/50">
          <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            当前执行位置: 第 {currentCodeLine} 行
          </p>
        </div>
      )}
    </div>
  );
};
