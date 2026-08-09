import React, { useState } from 'react';
import { History, Trash2, Filter, Clock, Tag } from 'lucide-react';
import { TimelineEntry } from '../types';

interface TimelineScreenProps {
  timelineEntries: TimelineEntry[];
  onDeleteEntry: (id: number) => void;
}

const CATEGORIES = ['All', 'Work', 'Study', 'Coding', 'Testing', 'Personal', 'Exercise', 'Break', 'Other'];

export const TimelineScreen: React.FC<TimelineScreenProps> = ({ timelineEntries, onDeleteEntry }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredEntries = timelineEntries.filter((entry) => {
    if (selectedCategory === 'All') return true;
    return entry.category === selectedCategory;
  });

  const formatTimestamp = (millis: number) => {
    const d = new Date(millis);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (millis: number) => {
    const d = new Date(millis);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-white">Daily Timeline Log</h2>
            <p className="text-xs text-slate-400">Chronological history of focus sessions, notes, goals, and reviews</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30 text-emerald-400" />
          <p className="text-sm font-semibold">No timeline entries found</p>
          <p className="text-xs text-slate-500 mt-1">Start an activity timer or save a note to record timeline logs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-md flex items-start justify-between gap-4 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-300 block">
                    {formatTimestamp(entry.timestampMillis)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {formatDateHeader(entry.timestampMillis)}
                  </span>
                </div>

                <div className="w-px h-10 bg-slate-800 shrink-0 self-center" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900/50">
                      {entry.type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {entry.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mt-1">{entry.title}</h3>

                  {entry.note && <p className="text-xs text-slate-300 mt-1 leading-relaxed">{entry.note}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {entry.durationMinutes && (
                  <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950 border border-indigo-800 px-2.5 py-1 rounded-lg">
                    {entry.durationMinutes} min
                  </span>
                )}

                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete timeline entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
