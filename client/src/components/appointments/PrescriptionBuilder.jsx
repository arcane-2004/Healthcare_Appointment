import React from 'react';
import { Plus, Trash2, Pill } from 'lucide-react';

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 8 hours',
  'As needed (SOS)'
];

const PrescriptionBuilder = ({ items = [], onChange }) => {
  const addItem = () => {
    onChange([
      ...items,
      {
        medicine: '',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'After food'
      }
    ]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Pill className="w-3.5 h-3.5 text-primary-500" />
          Prescribed Medications ({items.length})
        </label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Medicine
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
          No medications added yet. Click &quot;Add Medicine&quot; above to prescribe.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Medicine #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-slate-400 hover:text-rose-600 transition p-1"
                  title="Remove medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin 500mg"
                    value={item.medicine}
                    onChange={(e) => updateItem(idx, 'medicine', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 tablet"
                    value={item.dosage}
                    onChange={(e) => updateItem(idx, 'dosage', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Frequency
                  </label>
                  <select
                    value={item.frequency}
                    onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 days, 2 weeks"
                    value={item.duration}
                    onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Take with food, avoid dairy, drink plenty of water"
                  value={item.instructions}
                  onChange={(e) => updateItem(idx, 'instructions', e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionBuilder;
