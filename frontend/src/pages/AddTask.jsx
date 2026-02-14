import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { addTask, updateTask, todayStr } from '../db';

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'custom', label: 'Custom' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'bg-red-500' },
];

export default function AddTask() {
  const { categories, dispatch, showToast, theme } = useApp();
  const [editingTask, setEditingTask] = useState(null);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [recurrence, setRecurrence] = useState('none');
  const [customInterval, setCustomInterval] = useState(7);
  const [priority, setPriority] = useState('medium');

  // Check if editing
  useEffect(() => {
    const editData = sessionStorage.getItem('editTask');
    if (editData) {
      sessionStorage.removeItem('editTask');
      const task = JSON.parse(editData);
      setEditingTask(task);
      setTitle(task.title || '');
      setNotes(task.notes || '');
      setCategory(task.category || '');
      setDueDate(task.dueDate || todayStr());
      setRecurrence(task.recurrence || 'none');
      setCustomInterval(task.customInterval || 7);
      setPriority(task.priority || 'medium');
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      notes: notes.trim(),
      category: category || categories[0]?.name || 'General',
      dueDate,
      recurrence,
      customInterval: recurrence === 'custom' ? parseInt(customInterval) : undefined,
      priority,
    };

    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      showToast('Task updated!');
    } else {
      await addTask(taskData);
      showToast('Task added!');
    }

    // Reset
    setTitle('');
    setNotes('');
    setCategory('');
    setDueDate(todayStr());
    setRecurrence('none');
    setCustomInterval(7);
    setPriority('medium');
    setEditingTask(null);

    dispatch({ type: 'SET_TAB', payload: 'dashboard' });
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm transition-colors tap-target ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`;

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold dark:text-white mb-4">
        {editingTask ? 'Edit Task' : 'Add Task'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Task title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Clean the kitchen counters"
            className={inputClass}
            autoFocus
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details..."
            rows={2}
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Room / Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target ${
                  category === cat.name
                    ? 'ring-2 ring-offset-1 shadow-sm'
                    : 'opacity-60 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: cat.color + '20',
                  color: cat.color,
                  ...(category === cat.name ? { ringColor: cat.color } : {}),
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Due date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Priority
          </label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all tap-target ${
                  priority === opt.value
                    ? `${opt.color} text-white shadow-md`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recurrence */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Repeat
          </label>
          <div className="flex flex-wrap gap-2">
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecurrence(opt.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all tap-target ${
                  recurrence === opt.value
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {recurrence === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Every</span>
              <input
                type="number"
                min="1"
                max="365"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                className={`w-20 px-3 py-2 rounded-xl border text-sm text-center ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200'
                }`}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-semibold text-base tap-target active:scale-[0.98] transition-transform shadow-lg shadow-emerald-500/20"
        >
          {editingTask ? 'Update Task' : 'Add Task'}
        </button>

        {editingTask && (
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setTitle('');
              setNotes('');
              setCategory('');
              setDueDate(todayStr());
              setRecurrence('none');
              setPriority('medium');
            }}
            className="w-full py-3 text-gray-400 text-sm font-medium"
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}
