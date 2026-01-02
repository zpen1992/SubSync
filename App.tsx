
import React, { useState, useMemo } from 'react';
import { parseSRT, stringifySRT } from './utils/subtitleParser';
import { SubtitleEntry, ComparisonResult } from './types';
import FileUpload from './components/FileUpload';
import ComparisonRow from './components/ComparisonRow';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis, Tooltip } from 'recharts';

const App: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<{ name: string; content: string } | null>(null);
  const [translatedFile, setTranslatedFile] = useState<{ name: string; content: string } | null>(null);
  const [showOnlyMismatches, setShowOnlyMismatches] = useState(false);
  
  const [manualCorrections, setManualCorrections] = useState<Record<number, SubtitleEntry>>({});

  const originalEntries = useMemo(() => originalFile ? parseSRT(originalFile.content) : [], [originalFile]);
  const initialTranslatedEntries = useMemo(() => translatedFile ? parseSRT(translatedFile.content) : [], [translatedFile]);

  const translatedEntries = useMemo(() => {
    return initialTranslatedEntries.map(entry => {
      if (manualCorrections[entry.index]) {
        return { ...entry, ...manualCorrections[entry.index] };
      }
      return entry;
    });
  }, [initialTranslatedEntries, manualCorrections]);

  const comparisonResults = useMemo(() => {
    if (!originalEntries.length) return [];
    
    return originalEntries.map(orig => {
      let trans = translatedEntries.find(t => t.index === orig.index);
      
      if (!trans) {
        trans = translatedEntries.find(t => Math.abs(t.startTimeMs - orig.startTimeMs) < 500);
      }

      if (!trans) {
        return {
          original: orig,
          isMatch: false,
          timeDiffStart: 0,
          timeDiffEnd: 0,
          errorType: 'MISSING' as const
        };
      }

      const diffStart = trans.startTimeMs - orig.startTimeMs;
      const diffEnd = trans.endTimeMs - orig.endTimeMs;
      const isMatch = Math.abs(diffStart) < 20 && Math.abs(diffEnd) < 20;

      return {
        original: orig,
        translated: trans,
        isMatch,
        timeDiffStart: diffStart,
        timeDiffEnd: diffEnd,
        errorType: isMatch ? 'NONE' : 'TIME_MISMATCH' as const
      };
    });
  }, [originalEntries, translatedEntries]);

  const handleSyncEntry = (index: number) => {
    const orig = originalEntries.find(e => e.index === index);
    if (!orig) return;

    setManualCorrections(prev => ({
      ...prev,
      [index]: {
        ...translatedEntries.find(t => t.index === index) || { text: '', index: index } as any,
        startTime: orig.startTime,
        endTime: orig.endTime,
        startTimeMs: orig.startTimeMs,
        endTimeMs: orig.endTimeMs
      }
    }));
  };

  const handleSyncAll = () => {
    const newCorrections = { ...manualCorrections };
    comparisonResults.forEach(res => {
      if (!res.isMatch && res.translated) {
        newCorrections[res.original.index] = {
          ...res.translated,
          startTime: res.original.startTime,
          endTime: res.original.endTime,
          startTimeMs: res.original.startTimeMs,
          endTimeMs: res.original.endTimeMs
        };
      }
    });
    setManualCorrections(newCorrections);
  };

  const handleExport = () => {
    if (!translatedEntries.length) return;
    const content = stringifySRT(translatedEntries);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Synced_${translatedFile?.name || 'subtitles.srt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const total = comparisonResults.length;
    const mismatches = comparisonResults.filter(r => !r.isMatch).length;
    const matchRate = total ? (((total - mismatches) / total) * 100).toFixed(1) : '0';
    return { total, mismatches, matchRate };
  }, [comparisonResults]);

  const filteredResults = useMemo(() => {
    return showOnlyMismatches ? comparisonResults.filter(r => !r.isMatch) : comparisonResults;
  }, [comparisonResults, showOnlyMismatches]);

  const chartData = useMemo(() => {
    return comparisonResults.slice(0, 100).map((r) => ({
      name: `#${r.original.index}`,
      diff: Math.abs(r.timeDiffStart),
      status: r.isMatch ? 'match' : 'mismatch'
    }));
  }, [comparisonResults]);

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-slate-900 text-white py-6 px-8 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SubSync Pro</h1>
              <p className="text-slate-400 text-xs font-medium">100% 本地运行 · 字幕时间轴同步工具</p>
            </div>
          </div>

          {originalFile && translatedFile && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 border-r border-slate-700 pr-4">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">对齐率</p>
                  <p className="text-xl font-mono font-bold leading-none">{stats.matchRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">待修正</p>
                  <p className={`text-xl font-mono font-bold leading-none ${stats.mismatches > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {stats.mismatches}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowOnlyMismatches(!showOnlyMismatches)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${showOnlyMismatches ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                >
                  {showOnlyMismatches ? '仅显示偏差' : '显示全部'}
                </button>
                <button 
                  onClick={handleExport}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载同步稿
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {!originalFile || !translatedFile ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">快速对齐字幕时间轴</h2>
            <p className="text-slate-500 mb-10">通过对比原文，一键修正 AI 翻译后产生的时间轴偏移。</p>
            <div className="flex flex-col md:flex-row gap-8">
              <FileUpload 
                id="original"
                label="Step 1: 原始英文字幕"
                description="作为标准时间轴的 SRT 文件"
                fileName={originalFile?.name || null}
                onFileSelect={(content, name) => setOriginalFile({ content, name })}
                accentColor="blue"
              />
              <div className="flex items-center justify-center text-slate-300">
                <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>
              <FileUpload 
                id="translated"
                label="Step 2: 翻译后的字幕"
                description="需要修正时间轴的 SRT 文件"
                fileName={translatedFile?.name || null}
                onFileSelect={(content, name) => setTranslatedFile({ content, name })}
                accentColor="indigo"
              />
            </div>
            <div className="mt-12 p-4 bg-slate-50 rounded-xl inline-flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              文件内容仅在本地处理，绝不上传服务器
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">批量同步</h3>
                <button 
                  onClick={handleSyncAll}
                  disabled={stats.mismatches === 0}
                  className={`w-full py-4 px-4 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 mb-6 ${stats.mismatches > 0 ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>全量对齐时间轴</span>
                  <span className="text-[10px] opacity-70 font-normal">修正 {stats.mismatches} 个偏差</span>
                </button>
                
                <div className="pt-4 border-t border-slate-50">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3">时间轴偏差概览 (Top 100)</h4>
                   <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" hide />
                        <Tooltip 
                           labelStyle={{ fontSize: '10px' }}
                           contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="diff" radius={[2, 2, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.status === 'match' ? '#e2e8f0' : '#f59e0b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 border-dashed">
                <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">使用说明</h3>
                <ul className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
                  <li>• 对齐逻辑：通过字幕编号 (Index) 将翻译稿的时间轴强行对齐为原文时间轴。</li>
                  <li>• 适用场景：AI 翻译时改变了时间轴，但没有严重删除/合并内容的情况。</li>
                  <li>• 隐私保护：所有修正均在您的浏览器中完成。</li>
                </ul>
              </div>

              <button 
                onClick={() => { setOriginalFile(null); setTranslatedFile(null); setManualCorrections({}); }}
                className="w-full py-3 text-slate-400 text-xs font-medium hover:text-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                清除当前工作并返回
              </button>
            </div>

            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[78vh]">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">双语内容核对</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">共 {filteredResults.length} 条记录</span>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <ComparisonRow 
                      key={result.original.index} 
                      result={result} 
                      onSync={handleSyncEntry}
                    />
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-lg font-bold text-slate-400">恭喜！全部对齐</p>
                    <p className="text-sm">当前列表没有任何时间轴偏差。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
