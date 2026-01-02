
import React from 'react';
import { ComparisonResult } from '../types';

interface ComparisonRowProps {
  result: ComparisonResult;
  onSync: (originalIndex: number) => void;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({ result, onSync }) => {
  const { original, translated, isMatch, timeDiffStart, timeDiffEnd, errorType } = result;

  const getStatusColor = () => {
    if (errorType === 'MISSING') return 'bg-red-50 border-red-200';
    if (!isMatch) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-100 hover:bg-gray-50';
  };

  const getDiffLabel = (diff: number) => {
    if (Math.abs(diff) < 10) return null;
    return (
      <span className={`text-[10px] font-bold px-1 rounded ${diff > 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
        {diff > 0 ? `+${diff}ms` : `${diff}ms`}
      </span>
    );
  };

  return (
    <div className={`group border-b transition-colors flex ${getStatusColor()} px-4 py-3`}>
      <div className="w-12 flex-shrink-0 text-gray-400 text-xs font-mono pt-1">
        #{original.index}
      </div>

      <div className="flex-1 pr-4 border-r border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1 rounded">
            {original.startTime} → {original.endTime}
          </span>
        </div>
        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">{original.text}</p>
      </div>

      <div className="flex-1 pl-4 relative">
        {translated ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-mono px-1 rounded ${!isMatch ? 'bg-amber-100 text-amber-700 font-bold' : 'text-green-600 bg-green-50'}`}>
                {translated.startTime} → {translated.endTime}
              </span>
              <div className="flex gap-1">
                {getDiffLabel(timeDiffStart)}
                {getDiffLabel(timeDiffEnd)}
              </div>
              
              <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isMatch && (
                  <button 
                    onClick={() => onSync(original.index)}
                    className="bg-green-600 text-white text-[10px] px-3 py-1 rounded-full hover:bg-green-700 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                    title="Sync timeline to match original"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    对齐时间轴
                  </button>
                )}
                {isMatch && (
                  <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    已对齐
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-line leading-snug">
              {translated.text.split('\n').map((line, i) => (
                <span key={i} className={i === 0 ? 'block font-semibold text-indigo-700' : 'block text-gray-500 italic text-xs'}>
                  {line}
                </span>
              ))}
            </p>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-red-50 rounded border border-dashed border-red-200">
            <span className="text-xs text-red-500 font-medium">翻译稿缺失该片段</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonRow;
