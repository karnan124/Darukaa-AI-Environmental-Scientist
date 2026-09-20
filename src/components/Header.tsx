import React from 'react';
import { Leaf, Database, RotateCcw, Play, BookOpen } from 'lucide-react';

interface HeaderProps {
  onRunBenchmark: () => void;
  onResetSession: () => void;
  onOpenKnowledge: () => void;
  isLoading: boolean;
  totalDocs: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRunBenchmark,
  onResetSession,
  onOpenKnowledge,
  isLoading,
  totalDocs,
}) => {
  return (
    <header id="app-header" className="w-full bg-stone-900 text-stone-100 border-b border-stone-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-700/80 flex items-center justify-center text-emerald-100 border border-emerald-600/50 shadow-inner">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">AI Environmental Scientist</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Evidence-Grounded Intelligence
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Multi-Metric Ecosystem Reasoning & Scientific Decision Support
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            id="btn-knowledge-base"
            type="button"
            onClick={onOpenKnowledge}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Knowledge Base ({totalDocs})</span>
          </button>

          <button
            id="btn-reset-session"
            type="button"
            onClick={onResetSession}
            title="Clear context and reset memory"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Reset Memory</span>
          </button>

          <button
            id="btn-benchmark-scenario"
            type="button"
            disabled={isLoading}
            onClick={onRunBenchmark}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Benchmark Scenario</span>
          </button>
        </div>
      </div>
    </header>
  );
};
