import React from 'react';
import type { AnalysisResponse } from '../types/environmental.js';
import {
  Activity,
  GitCommit,
  CheckCircle2,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  Info,
} from 'lucide-react';

interface AnalysisReportViewProps {
  analysis: AnalysisResponse;
  onOpenSourceModal?: (docId: string) => void;
}

export const AnalysisReportView: React.FC<AnalysisReportViewProps> = ({ analysis }) => {
  return (
    <div id="environmental-analysis-report" className="space-y-6">
      {/* 1. Scientific Executive Summary Header */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-6 border border-stone-800 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Environmental Intelligence Synthesis</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Multi-Metric RAG Assessment
          </span>
        </div>

        <div className="prose prose-invert prose-stone max-w-none text-xs leading-relaxed text-stone-300">
          <p className="whitespace-pre-line">{analysis.summary}</p>
        </div>

        {/* Rigor notice */}
        <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-start gap-2 text-[11px] text-stone-400">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Methodological Rigor</strong>: Grounded strictly in peer-reviewed ecological literature (FAO, IPCC, IPBES, UNEP, USGS). Quantitative claims without verified baseline empirical support are rejected.
          </span>
        </div>
      </div>

      {/* 2. Observed Conditions & Diagnostic Matrix */}
      {analysis.environmental_assessment && analysis.environmental_assessment.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-stone-900">Observed Conditions & Ecosystem Diagnostics</h3>
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              {analysis.environmental_assessment.length} Parameters Evaluated
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {analysis.environmental_assessment.map((item, idx) => {
              const statusColor =
                item.status === 'critical'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : item.status === 'suboptimal'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <div key={idx} className="p-4 hover:bg-stone-50/70 transition flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 text-xs">
                  <div className="sm:w-1/3">
                    <span className="font-semibold text-stone-900">{item.metric}</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono font-medium text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                        {String(item.value)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="sm:w-2/3 text-stone-600 leading-relaxed">
                    {item.interpretation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Key Multi-Metric Interactions (at least 3 variables linked simultaneously) */}
      {analysis.interactions && analysis.interactions.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-stone-900">Key Multi-Metric Interactions (≥ 3 Variables)</h3>
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              Non-Linear Ecosystem Dynamics
            </span>
          </div>

          <div className="p-5 space-y-4">
            {analysis.interactions.map((inter, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-stone-50/70 border border-stone-200 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {inter.variables.map((v, vIdx) => (
                      <React.Fragment key={vIdx}>
                        <span className="font-semibold px-2 py-0.5 bg-stone-200/70 text-stone-800 rounded text-[11px]">
                          {v}
                        </span>
                        {vIdx < inter.variables.length - 1 && (
                          <span className="text-stone-400 font-bold">↔</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    inter.severity_or_importance === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {inter.severity_or_importance} feedback
                  </span>
                </div>

                <div className="font-medium text-stone-900 text-xs">
                  {inter.interaction_type}
                </div>

                <p className="text-stone-600 leading-relaxed">
                  {inter.description}
                </p>

                <div className="pt-2 border-t border-stone-200/70 text-[11px] text-emerald-900 font-medium">
                  <strong>Scientific Basis</strong>: {inter.scientific_basis}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Evidence-Grounded Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Evidence-Grounded Actionable Interventions ({analysis.recommendations.length})</span>
            </h3>
            <span className="text-[11px] text-stone-500">
              Prioritized by ecological efficacy & biophysical constraints
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {analysis.recommendations.map((rec, idx) => (
              <div
                key={rec.id || idx}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs hover:border-emerald-500/50 transition space-y-3.5 text-xs"
              >
                {/* Header row with badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-stone-900 text-sm">
                      {rec.action.slice(0, 80)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                      <Clock className="w-3 h-3 text-stone-500" />
                      <span>{rec.time_horizon}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{rec.confidence} Confidence</span>
                    </span>
                  </div>
                </div>

                {/* 1. What to do */}
                <div>
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    1. Concrete Action
                  </div>
                  <p className="text-stone-900 font-medium leading-relaxed">
                    {rec.action}
                  </p>
                </div>

                {/* 2. Why it works */}
                <div>
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                    2. Biophysical Mechanism
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    {rec.why_it_works}
                  </p>
                </div>

                {/* 3. Impacted Metrics */}
                <div>
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    3. Impacted Environmental Metrics
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.impacted_metrics.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expected Impact (No fake numbers) */}
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Expected Empirical Impact
                  </div>
                  <p className="text-stone-700 text-xs leading-relaxed">
                    {rec.expected_impact}
                  </p>
                </div>

                {/* Evidence Citation */}
                <div className="bg-emerald-950/5 rounded-lg p-3 border border-emerald-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Peer-Reviewed Literature Grounding
                    </div>
                    <p className="font-semibold text-stone-900 text-xs">
                      {rec.evidence.source_title}
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      {rec.evidence.organization} ({rec.evidence.year})
                    </p>
                  </div>
                  <a
                    href={rec.evidence.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
                  >
                    <span>Inspect Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Limitations */}
                <div className="flex items-start gap-2 text-[11px] text-amber-900 bg-amber-50/70 p-2.5 rounded border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Biophysical Limitations & Conditions</strong>: {rec.limitations}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Retrieved Scientific Sources List */}
      {analysis.sources && analysis.sources.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-semibold text-stone-900">Retrieved Scientific Literature ({analysis.sources.length})</h3>
            </div>
            <span className="text-[11px] font-medium text-stone-500">
              Verified Institutional Knowledge Base
            </span>
          </div>

          <div className="divide-y divide-stone-100 p-2">
            {analysis.sources.map((src, idx) => (
              <div key={idx} className="p-3 hover:bg-stone-50/80 rounded-lg transition text-xs space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-stone-900 hover:text-emerald-700 flex items-center gap-1 group"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-emerald-700" />
                  </a>
                  {src.relevance_score !== undefined && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Score: {Math.round(src.relevance_score * 100)}%
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 flex items-center gap-3">
                  <span><strong>Publisher</strong>: {src.organization}</span>
                  <span><strong>Year</strong>: {src.year}</span>
                  <span><strong>Domain</strong>: {src.topic}</span>
                </div>
                {src.why_relevant && (
                  <p className="text-[11px] text-emerald-800/90 font-medium">
                    {src.why_relevant}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
