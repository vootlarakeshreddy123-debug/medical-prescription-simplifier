import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Moon,
  Pill,
  Search,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { Medicine, Prescription } from '../types';

interface MedicationCabinetProps {
  prescriptions: Prescription[];
  onSelectPrescription: (rx: Prescription) => void;
}

export const MedicationCabinet: React.FC<MedicationCabinetProps> = ({
  prescriptions,
  onSelectPrescription,
}) => {
  const [filterRoutine, setFilterRoutine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect all unique medicines across prescriptions
  const allMedicines: { medicine: Medicine; prescription: Prescription }[] = [];
  prescriptions.forEach((rx) => {
    rx.medicines.forEach((m) => {
      allMedicines.push({ medicine: m, prescription: rx });
    });
  });

  const filteredMedicines = allMedicines.filter(({ medicine }) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.instructions.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRoutine === 'morning') return medicine.timingOfDay.includes('morning');
    if (filterRoutine === 'afternoon') return medicine.timingOfDay.includes('afternoon');
    if (filterRoutine === 'evening') return medicine.timingOfDay.includes('evening');
    if (filterRoutine === 'bedtime') return medicine.timingOfDay.includes('bedtime');
    if (filterRoutine === 'as_needed') return medicine.timingOfDay.includes('as_needed');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2">
            <Pill className="w-3.5 h-3.5" /> Patient Medication Cabinet
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your Active Medicines & Regimens</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize and track all medications prescribed across your active prescriptions.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicines or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Routine Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Medicines', icon: Layers },
          { id: 'morning', label: 'Morning Routine', icon: Sunrise },
          { id: 'afternoon', label: 'Afternoon / Lunch', icon: Sun },
          { id: 'evening', label: 'Evening Routine', icon: Sunset },
          { id: 'bedtime', label: 'Bedtime', icon: Moon },
          { id: 'as_needed', label: 'As Needed (SOS)', icon: Clock },
        ].map((f) => {
          const Icon = f.icon;
          const isActive = filterRoutine === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterRoutine(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          );
        })}
      </div>

      {/* Medicines Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No Medicines Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try changing your search query or routine filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicines.map(({ medicine, prescription }, idx) => (
            <div
              key={`${medicine.id}_${idx}`}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                      {medicine.name}
                    </h3>
                    <p className="text-xs text-slate-500">{medicine.genericName} • {medicine.strength}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-md">
                    {medicine.dosage}
                  </span>
                </div>

                <div className="space-y-2 text-xs pt-3">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Frequency:</span>
                    <strong>{medicine.frequency}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Duration:</span>
                    <strong>{medicine.duration}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500">Route:</span>
                    <strong>{medicine.route}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100">
                    {medicine.instructions}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
                  Rx: {prescription.title}
                </span>
                <button
                  onClick={() => onSelectPrescription(prescription)}
                  className="text-teal-700 hover:text-teal-900 font-bold hover:underline"
                >
                  View Prescription →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
