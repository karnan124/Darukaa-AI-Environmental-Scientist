import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/environmental.js';
import { Send, User, Sparkles, HelpCircle, ArrowRight, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
  onQuickClarify: (answer: string) => void;
}

interface PromptCategory {
  title: string;
  prompts: { label: string; text: string; description: string }[];
}

const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    title: 'Benchmark & Stress Scenarios',
    prompts: [
      {
        label: 'Official Benchmark (Degraded Dryland)',
        text: 'Soil organic carbon is 0.3%, rainfall is low, crop is monoculture wheat in a semi-arid zone.',
        description: 'Compounding SOC deficit, low precipitation, and monoculture vulnerability',
      },
      {
        label: 'Severe Soil Acidification & Runoff',
        text: 'Soil pH is 4.8 with high pesticide runoff and severe habitat fragmentation on monoculture corn.',
        description: 'Chemical degradation, low microbial activity, and ecological disconnection',
      },
      {
        label: 'Alkaline Salinity in Irrigated Basins',
        text: 'Soil pH is 8.6, moisture is 12%, with erratic rainfall pattern and declining pollinator diversity in cotton cultivation.',
        description: 'Micronutrient lockup, secondary salinization, and pollinator collapse',
      },
    ],
  },
  {
    title: 'Agroforestry & Regenerative Inquiries',
    prompts: [
      {
        label: 'Cereal-Legume Intercropping & Moisture',
        text: 'How does introducing chickpeas into a rainfed wheat cropping system improve soil moisture conservation and nitrogen balance?',
        description: 'Microbial symbiosis, Rhizobium fixation, and evapotranspiration reduction',
      },
      {
        label: 'Hedgerows & Pollinator Buffers',
        text: 'Surrounding landscape is fragmented with high deforestation pressure. How do native flowering buffer strips recover wild bees?',
        description: 'Floral nectar corridors, biological pest predation, and IPBES guidelines',
      },
      {
        label: 'No-Till Stubble Retention Under Drought',
        text: 'Annual rainfall is 320mm. Will 100% wheat residue retention lower soil temperature and buffer crop drought stress?',
        description: 'Albedo modulation, soil temperature dampening, and capillary moisture conservation',
      },
    ],
  },
  {
    title: 'Clarification & Diagnostic Triggers',
    prompts: [
      {
        label: 'Vague Biodiversity Symptom',
        text: 'My biodiversity is declining on my farm and beneficial insects are disappearing.',
        description: 'Tests missing-information detection & targeted follow-up questions',
      },
      {
        label: 'Partial Field Measurement',
        text: 'Recent soil test shows organic carbon at 0.5% in a temperate Mediterranean region.',
        description: 'Tests multi-turn context accumulation for subsequent crop and climate inputs',
      },
    ],
  },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectPrompt,
  onQuickClarify,
}) => {
  const [inputText, setInputText] = useState('');
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
    setShowPromptDrawer(false);
  };

  const handleSelectPrompt = (promptText: string) => {
    onSelectPrompt(promptText);
    setShowPromptDrawer(false);
  };

  return (
    <div id="chat-panel" className="flex flex-col h-full bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-stone-900">Conversational Environmental Intelligence</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowPromptDrawer((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition"
        >
          <Lightbulb className="w-3.5 h-3.5 text-emerald-700" />
          <span>Suggested Inputs</span>
          {showPromptDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Suggested Prompts Drawer (Toggleable at any time) */}
      {showPromptDrawer && (
        <div className="p-3 bg-stone-50 border-b border-stone-200 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
              Explore Input Scenarios & Scientific Questions
            </span>
            <span className="text-[10px] text-stone-400">Click any prompt to evaluate</span>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIZED_PROMPTS.map((cat, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => setActiveCategoryIndex(cIdx)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition ${
                  activeCategoryIndex === cIdx
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Active Category Prompts */}
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {CATEGORIZED_PROMPTS[activeCategoryIndex].prompts.map((p, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSelectPrompt(p.text)}
                className="text-left p-2 rounded-lg bg-white border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition group space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-900 group-hover:text-emerald-900">
                    {p.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 shrink-0 ml-1.5" />
                </div>
                <p className="text-[11px] text-stone-600 line-clamp-1 italic">
                  "{p.text}"
                </p>
                <p className="text-[10px] text-stone-400">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-start text-center p-4 text-stone-500 space-y-4 overflow-y-auto">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 mt-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-bold text-stone-800">AI Environmental Scientist</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Provide observed field conditions in natural language. The system extracts multi-pillar variables, identifies missing parameters, and derives compounding interactions.
              </p>
            </div>

            {/* Categorized Starter Prompts */}
            <div className="w-full max-w-md space-y-3 pt-1 text-left">
              {CATEGORIZED_PROMPTS.map((category, cIdx) => (
                <div key={cIdx} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    {category.title}
                  </span>
                  <div className="space-y-1.5">
                    {category.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSelectPrompt(p.text)}
                        className="w-full text-left px-3 py-2 text-xs bg-stone-50 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 rounded-lg transition flex items-center justify-between group"
                      >
                        <div className="pr-2 min-w-0">
                          <div className="font-semibold text-stone-800 group-hover:text-emerald-950 truncate">
                            {p.label}
                          </div>
                          <div className="text-[11px] text-stone-500 group-hover:text-emerald-800/80 truncate">
                            {p.text}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-stone-900 text-stone-100 rounded-tr-none'
                      : msg.is_clarification
                      ? 'bg-amber-50/80 border border-amber-200 text-stone-900 rounded-tl-none'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-tl-none'
                  }`}
                >
                  {/* Sender title */}
                  <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 pb-1 text-[11px] font-semibold">
                    <span className={isUser ? 'text-stone-300' : 'text-emerald-800'}>
                      {isUser ? 'User Inquiry' : msg.is_clarification ? 'Missing Context Follow-Up' : 'Environmental Scientist'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message body */}
                  <div className="whitespace-pre-line text-xs">
                    {msg.text}
                  </div>

                  {/* Extracted variables badge on user message */}
                  {isUser && msg.extracted_variables && msg.extracted_variables.length > 0 && (
                    <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-emerald-400 font-medium">Extracted:</span>
                      {msg.extracted_variables.map((field, fIdx) => (
                        <span key={fIdx} className="bg-stone-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          +{field}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* If assistant asked for clarification, provide quick one-click answers */}
                  {!isUser && msg.is_clarification && (
                    <div className="pt-3 border-t border-amber-200/80 space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        <HelpCircle className="w-3 h-3" />
                        <span>Quick Clarification Presets</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => onQuickClarify('It is a monoculture wheat farm in a semi-arid zone.')}
                          className="px-2.5 py-1 text-[11px] bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-300 hover:border-emerald-400 rounded-md transition"
                        >
                          Monoculture wheat (semi-arid)
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickClarify('The soil organic carbon is 0.3% and rainfall is low.')}
                          className="px-2.5 py-1 text-[11px] bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-300 hover:border-emerald-400 rounded-md transition"
                        >
                          SOC 0.3% & Low rainfall
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickClarify('Surrounding landscape is fragmented with no natural hedgerows.')}
                          className="px-2.5 py-1 text-[11px] bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-300 hover:border-emerald-400 rounded-md transition"
                        >
                          Fragmented landscape
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Analyzing environmental relationships and retrieving scientific evidence...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="p-3 bg-stone-50 border-t border-stone-200">
        <div className="relative flex items-center">
          <input
            id="chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type observed conditions (e.g., 'Soil carbon is 0.3%, rainfall is low, crop is wheat')..."
            disabled={isLoading}
            className="w-full pl-3.5 pr-11 py-2.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition disabled:opacity-50"
          />
          <button
            id="btn-chat-send"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-md bg-emerald-700 text-white hover:bg-emerald-600 transition disabled:opacity-30"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
