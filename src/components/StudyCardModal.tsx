import React, { useState } from 'react';
import { X, Brain, Tag } from 'lucide-react';

interface StudyCardModalProps {
  onDismiss: () => void;
  onSave: (topic: string, question: string, answer: string) => void;
}

export const StudyCardModal: React.FC<StudyCardModalProps> = ({ onDismiss, onSave }) => {
  const [topic, setTopic] = useState('Software Testing');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    onSave(topic.trim() || 'General', question.trim(), answer.trim());
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-purple-400">
            <Brain className="w-5 h-5" />
            <h3 className="font-heading font-bold text-lg text-white">New Active Recall Flashcard</h3>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Subject / Topic
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Software Testing, System Design, Algorithms..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Question / Concept Prompt *
            </label>
            <textarea
              rows={2}
              required
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What question requires active recall?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Answer / Explanation *
            </label>
            <textarea
              rows={3}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Comprehensive explanation or key bullet points..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onDismiss}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || !answer.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              Save Flashcard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
