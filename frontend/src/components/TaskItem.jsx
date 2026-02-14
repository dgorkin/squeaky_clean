import React, { useState, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { completeTask, uncompleteTask, deleteTask, deleteSeries, getSetting, unlockAchievement } from '../db';
import { triggerHaptic } from '../utils/haptics';
import { getRandomMessage, COMPLETION_MESSAGES, getMilestone } from '../utils/messages';

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function TaskItem({ task, onRefresh, onEdit, showDate = false }) {
  const { categories, hapticFeedback, showToast, showMilestone } = useApp();
  const [completing, setCompleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const category = categories.find((c) => c.name === task.category);

  async function handleToggle() {
    if (task.completed) {
      await uncompleteTask(task.id);
      onRefresh?.();
      return;
    }

    triggerHaptic(hapticFeedback);
    setCompleting(true);

    await completeTask(task.id);
    showToast(getRandomMessage(COMPLETION_MESSAGES));

    // Check milestones
    const total = await getSetting('totalCompleted');
    const milestone = getMilestone(total);
    if (milestone) {
      const isNew = await unlockAchievement(milestone.badge);
      if (isNew) {
        setTimeout(() => showMilestone(milestone), 800);
      }
    }

    setTimeout(() => {
      setCompleting(false);
      onRefresh?.();
    }, 600);
  }

  async function handleDelete() {
    setShowMenu(false);
    await deleteTask(task.id);
    onRefresh?.();
  }

  async function handleDeleteSeries() {
    setShowMenu(false);
    await deleteSeries(task.seriesId || task.id);
    onRefresh?.();
  }

  function formatDueDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-2xl transition-all duration-200 ${
      task.completed ? 'opacity-50' : 'bg-white dark:bg-gray-800 shadow-sm'
    }`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`relative flex-shrink-0 w-7 h-7 mt-0.5 rounded-full border-2 tap-target flex items-center justify-center transition-all duration-300 ${
          task.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-300 dark:border-gray-600 active:scale-90'
        } ${completing ? 'sparkle-burst' : ''}`}
      >
        {task.completed && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-sm dark:text-white ${
            task.completed ? 'task-complete-strike' : ''
          }`}>
            {task.title}
          </p>
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 tap-target p-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div ref={menuRef} className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-xl shadow-xl z-50 py-1 w-44 border border-gray-100 dark:border-gray-600">
                  <button
                    onClick={() => { setShowMenu(false); onEdit?.(task); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                  >
                    Edit Task
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete Task
                  </button>
                  {(task.recurrence && task.recurrence !== 'none') && (
                    <button
                      onClick={handleDeleteSeries}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete All in Series
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {category && (
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              {category.icon} {category.name}
            </span>
          )}
          {task.priority && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          )}
          {task.recurrence && task.recurrence !== 'none' && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              🔁 {task.recurrence === 'custom' ? `every ${task.customInterval}d` : task.recurrence}
            </span>
          )}
          {showDate && task.dueDate && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>

        {task.notes && !task.completed && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{task.notes}</p>
        )}
      </div>
    </div>
  );
}
