import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { ContextPillarsPanel } from './components/ContextPillarsPanel.js';
import { ChatPanel } from './components/ChatPanel.js';
import { AnalysisReportView } from './components/AnalysisReportView.js';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal.js';
import type { EnvironmentalContext, ChatMessage, AnalysisResponse } from './types/environmental.js';
import { EMPTY_ENVIRONMENTAL_CONTEXT } from './types/environmental.js';
import { Sparkles, Activity, FileText } from 'lucide-react';

export default function App() {
  const [sessionId] = useState<string>(() => `session_${Date.now()}`);
  const [context, setContext] = useState<EnvironmentalContext>(JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT)));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState<boolean>(false);
  const [totalDocs, setTotalDocs] = useState<number>(10);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'report'>('chat');

  // Load initial knowledge stats
  useEffect(() => {
    fetch('/api/knowledge/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data?.stats?.totalDocuments) {
          setTotalDocs(data.stats.totalDocuments);
        }
      })
      .catch((err) => console.warn('Could not load knowledge stats:', err));
  }, []);

  // Send natural language message
  const handleSendMessage = async (text: string) => {
    setIsLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text,
          structuredContext: context,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.context) {
          setContext(data.context);
        }
        if (data.history) {
          setMessages(data.history);
        }
        if (data.analysis) {
          setAnalysis(data.analysis);
          setActiveMobileTab('report');
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct analysis button
  const handleRunAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          environment: context,
          question: 'Synthesize comprehensive environmental assessment, multi-metric interactions, and evidence-grounded recommendations.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data);
        if (data.context_snapshot) {
          setContext(data.context_snapshot);
        }

        const reportNoticeMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: data.summary,
          timestamp: new Date().toISOString(),
          analysis: data,
        };
        setMessages((prev) => [...prev, reportNoticeMsg]);
        setActiveMobileTab('report');
      }
    } catch (err) {
      console.error('Error running direct analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Official Benchmark Demo Scenario
  const handleRunBenchmark = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (data.success) {
        setContext(data.context);
        setAnalysis(data.analysis);
        if (data.history) {
          setMessages(data.history);
        }
        setActiveMobileTab('report');
      }
    } catch (err) {
      console.error('Error running benchmark scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Session
  const handleResetSession = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/memory/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setContext(JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT)));
      setMessages([]);
      setAnalysis(null);
      setActiveMobileTab('chat');
    } catch (err) {
      console.error('Error resetting session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update context from panel
  const handleUpdateContext = (updated: Partial<EnvironmentalContext>) => {
    setContext((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  return (
    <div id="darukaa-app-root" className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans antialiased">
      {/* Top Application Header */}
      <Header
        onRunBenchmark={handleRunBenchmark}
        onResetSession={handleResetSession}
        onOpenKnowledge={() => setIsKnowledgeOpen(true)}
        isLoading={isLoading}
        totalDocs={totalDocs}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-4">
        {/* Environmental Context Pillars Bar */}
        <ContextPillarsPanel
          context={context}
          onUpdateContext={handleUpdateContext}
          onRunAnalysis={handleRunAnalysis}
          isLoading={isLoading}
        />

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden rounded-lg bg-stone-200 p-1 border border-stone-300">
          <button
            type="button"
            onClick={() => setActiveMobileTab('chat')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
              activeMobileTab === 'chat' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Chat & Inputs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('report')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
              activeMobileTab === 'report' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Analysis Report {analysis ? '(Ready)' : ''}</span>
          </button>
        </div>

        {/* Dual-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Left Column: Conversational Chat Panel */}
          <div
            className={`lg:col-span-5 h-[680px] ${
              activeMobileTab === 'chat' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onSelectPrompt={handleSendMessage}
              onQuickClarify={handleSendMessage}
            />
          </div>

          {/* Right Column: Environmental Science Analysis Report */}
          <div
            className={`lg:col-span-7 h-[680px] overflow-y-auto pr-1 ${
              activeMobileTab === 'report' ? 'block' : 'hidden lg:block'
            }`}
          >
            {analysis ? (
              <AnalysisReportView analysis={analysis} />
            ) : (
              <div className="h-full bg-white border border-stone-200 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="text-base font-bold text-stone-900 tracking-tight">
                    Environmental Diagnostics & Evidence Awaiting Data
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Provide field parameters in the chat or click the <strong>Run Benchmark Scenario</strong> button in the header to observe the complete multi-metric assessment linking soil organic carbon (0.3%), rainfall deficit, and wheat monoculture in semi-arid conditions.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunBenchmark}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Official Benchmark Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Verified Institutional Knowledge Base Modal */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
      />
    </div>
  );
}
