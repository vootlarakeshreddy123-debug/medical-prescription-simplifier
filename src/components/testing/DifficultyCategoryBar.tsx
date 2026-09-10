import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';
import { DifficultyCategory } from '../../testingTypes';

interface Props {
  categoryAccuracy: Record<
    DifficultyCategory,
    { total: number; completed: number; accuracy: number }
  >;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const DifficultyCategoryBar: React.FC<Props> = ({
  categoryAccuracy,
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const categories: { label: DifficultyCategory; desc: string }[] = [
    { label: 'Clear Printed', desc: 'Typed/Electronic Prescriptions' },
    { label: 'Clear Handwritten', desc: 'Legible Doctor Cursive' },
    { label: 'Medium Handwritten', desc: 'Average Clinical Handwriting' },
    { label: 'Difficult Handwritten', desc: 'Cursive / Faint / Rushed Strokes' },
    { label: 'Low Quality / Blurry', desc: 'Defocus, Shadows, Camera Angles' },
    { label: 'Mixed Prescription', desc: 'Syrups, Drops, Inhalers & Tabs' },
  ];

  const getAccuracyColor = (acc: number, completed: number) => {
    if (completed === 0) return 'text-slate-400 bg-slate-100';
    if (acc >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (acc >= 75) return 'text-teal-700 bg-teal-50 border-teal-200';
    if (acc >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getBarColor = (acc: number) => {
    if (acc >= 90) return 'bg-emerald-500';
    if (acc >= 75) return 'bg-teal-500';
    if (acc >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Accuracy by Image Difficulty Category</h3>
            <p className="text-xs text-slate-500">
              Evaluates extraction resilience across printed and handwriting clarity levels.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const stats = categoryAccuracy[cat.label] || { total: 0, completed: 0, accuracy: 0 };
          const isSelected = selectedCategory === cat.label;

          return (
            <div
              key={cat.label}
              onClick={() => onSelectCategory && onSelectCategory(isSelected ? 'all' : cat.label)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">{cat.label}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{cat.desc}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getAccuracyColor(
                    stats.accuracy,
                    stats.completed
                  )}`}
                >
                  {stats.completed > 0 ? `${stats.accuracy}%` : 'N/A'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 space-y-1">
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getBarColor(stats.accuracy)}`}
                    style={{ width: `${stats.completed > 0 ? stats.accuracy : 0}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>
                    {stats.completed} of {stats.total} evaluated
                  </span>
                  {stats.completed > 0 && (
                    <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {stats.accuracy}% match
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
