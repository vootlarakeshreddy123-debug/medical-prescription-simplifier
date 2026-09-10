import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Search,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { MedicalAbbreviation } from '../types';
import { safeFetchJson } from '../utils/api';

export const AbbreviationTranslator: React.FC = () => {
  const [abbreviations, setAbbreviations] = useState<MedicalAbbreviation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    safeFetchJson<MedicalAbbreviation[]>('/api/abbreviations')
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) setAbbreviations(res.data);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredList = abbreviations.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.abbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plainExplanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Medical Terminology Decoded
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Prescription Abbreviation Guide</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Translate medical abbreviations and Latin short-forms into plain, everyday language.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="abbreviation-search-input"
            type="text"
            placeholder="Search abbreviation (e.g. OD, BD, TDS, AC)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Abbreviations' },
          { id: 'timing', label: 'Timing & Frequency' },
          { id: 'food', label: 'Food Timing (AC / PC)' },
          { id: 'route', label: 'Route & Delivery (PO / INJ)' },
          { id: 'dosage', label: 'Dose & Quantity' },
          { id: 'urgency', label: 'Urgency (STAT / SOS)' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Abbreviation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  {item.abbr}
                </span>
                <span className="text-xs text-slate-400 italic">({item.meaning})</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {item.category}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Plain English Translation:</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{item.plainExplanation}</p>
            </div>

            {item.example && (
              <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-600 border border-slate-100">
                <strong className="text-slate-800">Example:</strong> {item.example}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
