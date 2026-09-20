import React, { useState, useEffect } from 'react';
import type { ScientificKnowledgeDocument, RetrievedEvidence } from '../types/environmental.js';
import { X, Search, ExternalLink, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const [documents, setDocuments] = useState<ScientificKnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RetrievedEvidence[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/knowledge/documents')
        .then((res) => res.json())
        .then((data) => {
          if (data.documents) {
            setDocuments(data.documents);
          }
        })
        .catch((err) => console.error('Error fetching knowledge documents:', err));
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 6 }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Error searching knowledge base:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Distinct topics
  const topics = ['all', ...Array.from(new Set(documents.map((d) => d.topic)))];

  const filteredDocs = searchResults !== null
    ? searchResults
    : selectedTopic === 'all'
    ? documents
    : documents.filter((d) => d.topic === selectedTopic);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Verified Institutional Knowledge Base</h2>
              <p className="text-[11px] text-stone-400">
                Peer-reviewed research and authoritative reports (FAO, IPCC, IPBES, UNEP, USGS)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Topic Filters */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value) setSearchResults(null);
                }}
                placeholder="Search across soil organic carbon, intercropping, drought, pollinators, agroforestry..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              Search
            </button>
            {searchResults !== null && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-medium rounded-lg transition"
              >
                Clear
              </button>
            )}
          </form>

          {/* Topic filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mr-1">
              Domain:
            </span>
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTopic(t);
                  setSearchResults(null);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition shrink-0 ${
                  selectedTopic === t && searchResults === null
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {t === 'all' ? 'All Publications' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Document Results List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-stone-100 space-y-4">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-xs">
              No matching scientific publications found in current repository.
            </div>
          ) : (
            filteredDocs.map((doc: any, idx: number) => (
              <div key={doc.id || idx} className="pt-4 first:pt-0 space-y-2 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider">
                        {doc.topic}
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium">
                        {doc.organization} ({doc.year})
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-stone-900 leading-snug">
                      {doc.title}
                    </h3>
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition"
                  >
                    <span>Official Publication</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-stone-600 text-xs leading-relaxed line-clamp-3">
                  {doc.content}
                </p>

                {doc.why_relevant && (
                  <div className="text-[11px] text-emerald-900 bg-emerald-50/60 p-2 rounded border border-emerald-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span><strong>Retrieval Relevance</strong>: {doc.why_relevant}</span>
                  </div>
                )}

                {doc.variables && doc.variables.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <Layers className="w-3 h-3 text-stone-400 mr-1" />
                    <span className="text-stone-400">Indexed variables:</span>
                    {doc.variables.map((v: string, vIdx: number) => (
                      <span key={vIdx} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Total Seed Literature: {documents.length} Authoritative Publications</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition text-xs font-semibold"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
