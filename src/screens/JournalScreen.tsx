import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Calendar, Smile, Tag, X } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalScreenProps {
  entries: JournalEntry[];
  onAddJournalEntry: (title: string, content: string, moodScore: number, category: string) => void;
  onDeleteJournalEntry: (id: number) => void;
}

const CATEGORIES = ['Reflective', 'Personal', 'Work', 'Study', 'Goals', 'Gratitude'];

export const JournalScreen: React.FC<JournalScreenProps> = ({
  entries,
  onAddJournalEntry,
  onDeleteJournalEntry,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodScore, setMoodScore] = useState(8);
  const [category, setCategory] = useState('Reflective');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddJournalEntry(title.trim(), content.trim(), moodScore, category);
    setTitle('');
    setContent('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-white">Reflective Journal</h2>
            <p className="text-xs text-slate-400">Capture long-form thoughts, achievements, and personal notes</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Cancel' : 'New Journal Entry'}</span>
        </button>
      </div>

      {/* New Journal Entry Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-amber-900/50 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in duration-150">
          <h3 className="font-heading font-bold text-base text-white">Write New Entry</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Entry Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Major milestone reached, Weekly summary..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mood ({moodScore}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodScore}
                  onChange={(e) => setMoodScore(parseInt(e.target.value))}
                  className="w-full mt-2 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Journal Content *
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Reflect deeply on your day, learnings, or ideas..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/30 transition-all disabled:opacity-50"
            >
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-400" />
          <p className="text-sm font-semibold">No journal entries yet</p>
          <p className="text-xs text-slate-500 mt-1">Start writing reflections to document your personal growth.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-3 transition-all group"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-900/50">
                    {entry.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(entry.createdAtMillis).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
                    <Smile className="w-3.5 h-3.5" /> Mood {entry.moodScore}/10
                  </span>
                  <button
                    onClick={() => onDeleteJournalEntry(entry.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-heading font-bold text-lg text-white">{entry.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
