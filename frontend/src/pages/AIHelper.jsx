import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { addTask, todayStr, formatDate } from '../db';

export default function AIHelper() {
  const { dispatch, showToast, theme } = useApp();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    if (!navigator.onLine) {
      setError("I need Wi-Fi to think! 📡");
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate schedule');
      }

      const data = await res.json();
      setSuggestions(data.tasks || []);
      const all = {};
      (data.tasks || []).forEach((_, i) => { all[i] = true; });
      setSelected(all);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again!');
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(index) {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function editSuggestion(index, field, value) {
    setSuggestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function handleAddSelected() {
    const toAdd = suggestions.filter((_, i) => selected[i]);
    if (toAdd.length === 0) return;

    const today = new Date();

    for (const task of toAdd) {
      const dueDate = getNextDueDate(today, task.frequency);
      await addTask({
        title: task.title,
        notes: task.notes || '',
        category: task.category || 'General',
        dueDate,
        recurrence: mapFrequencyToRecurrence(task.frequency),
        priority: task.priority || 'medium',
      });
    }

    showToast(`Added ${toAdd.length} task${toAdd.length > 1 ? 's' : ''}!`);
    setSuggestions(null);
    setPrompt('');
    dispatch({ type: 'SET_TAB', payload: 'dashboard' });
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm transition-colors tap-target ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`;

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold dark:text-white mb-1">AI Helper ✨</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Describe what you want to keep clean, and I&apos;ll suggest a schedule.
      </p>

      {/* Prompt input */}
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g., "Create a weekly cleaning routine for a 2-bedroom apartment" or "Maintenance schedule for my hot tub"'
          rows={3}
          className={inputClass}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full mt-3 bg-emerald-500 text-white py-3.5 rounded-xl font-semibold text-base tap-target active:scale-[0.98] transition-transform shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Thinking...' : 'Generate Schedule'}
        </button>
      </div>

      {/* Loading animation */}
      {loading && (
        <div className="flex flex-col items-center py-8">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
            <div className="absolute inset-2 flex items-center justify-center text-2xl">🧹</div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Sweeping up ideas...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestions && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Suggested Tasks ({suggestions.length})
            </h2>
            <button
              onClick={() => {
                const allSelected = suggestions.every((_, i) => selected[i]);
                const newSelected = {};
                suggestions.forEach((_, i) => { newSelected[i] = !allSelected; });
                setSelected(newSelected);
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
            >
              {suggestions.every((_, i) => selected[i]) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {suggestions.map((task, i) => (
              <div
                key={i}
                className={`rounded-2xl p-3 transition-all ${
                  selected[i]
                    ? 'bg-white dark:bg-gray-800 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-900 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(i)}
                    className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected[i]
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {selected[i] && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <input
                      value={task.title}
                      onChange={(e) => editSuggestion(i, 'title', e.target.value)}
                      className="font-medium text-sm w-full bg-transparent dark:text-white outline-none"
                    />
                    <div className="flex gap-2 mt-1 text-[11px] text-gray-400">
                      {task.frequency && <span>🔁 {task.frequency}</span>}
                      {task.category && <span>📍 {task.category}</span>}
                      {task.priority && <span>⚡ {task.priority}</span>}
                    </div>
                    {task.notes && (
                      <p className="text-xs text-gray-400 mt-1">{task.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddSelected}
            className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-semibold text-base tap-target active:scale-[0.98] transition-transform shadow-lg shadow-emerald-500/20"
          >
            Add {Object.values(selected).filter(Boolean).length} Task{Object.values(selected).filter(Boolean).length !== 1 ? 's' : ''} to Schedule
          </button>
        </div>
      )}

      {/* Example prompts */}
      {!suggestions && !loading && (
        <div className="mt-6">
          <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">Try asking:</h3>
          <div className="space-y-2">
            {[
              'Weekly cleaning routine for a 3-bedroom house',
              'Maintenance schedule for my hot tub',
              'Deep cleaning checklist for moving out',
              'Monthly kitchen maintenance tasks',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 shadow-sm active:scale-[0.98] transition-transform"
              >
                &quot;{example}&quot;
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function mapFrequencyToRecurrence(freq) {
  if (!freq) return 'none';
  const f = freq.toLowerCase();
  if (f.includes('daily') || f.includes('day')) return 'daily';
  if (f.includes('biweek') || f.includes('bi-week')) return 'biweekly';
  if (f.includes('week')) return 'weekly';
  if (f.includes('quarter')) return 'quarterly';
  if (f.includes('annual') || f.includes('year')) return 'annually';
  if (f.includes('month')) return 'monthly';
  return 'none';
}

function getNextDueDate(fromDate, frequency) {
  const date = new Date(fromDate);
  // Start from tomorrow for new tasks
  date.setDate(date.getDate() + 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
