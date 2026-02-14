import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../hooks/useApp';
import { getTasksInRange, formatDate } from '../db';
import TaskItem from '../components/TaskItem';
import { getRandomMessage, EMPTY_STATE_MESSAGES } from '../utils/messages';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { categories, dispatch } = useApp();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasksByDate, setTasksByDate] = useState({});
  const [selectedTasks, setSelectedTasks] = useState([]);

  const loadMonth = useCallback(async () => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const tasks = await getTasksInRange(formatDate(start), formatDate(end));

    const grouped = {};
    for (const t of tasks) {
      if (!grouped[t.dueDate]) grouped[t.dueDate] = [];
      grouped[t.dueDate].push(t);
    }
    setTasksByDate(grouped);
  }, [currentMonth]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedTasks(tasksByDate[selectedDate] || []);
    }
  }, [selectedDate, tasksByDate]);

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  }

  function handleEditTask(task) {
    dispatch({ type: 'SET_TAB', payload: 'add' });
    sessionStorage.setItem('editTask', JSON.stringify(task));
  }

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = formatDate(new Date());

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="tap-target p-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-lg font-bold dark:text-white">{monthName}</h1>
        <button onClick={nextMonth} className="tap-target p-2 text-gray-500 dark:text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-4">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dayTasks = tasksByDate[dateStr] || [];
          const hasIncomplete = dayTasks.some((t) => !t.completed);

          // Color dots from categories
          const categoryColors = [...new Set(dayTasks.map((t) => {
            const cat = categories.find((c) => c.name === t.category);
            return cat?.color || '#9ca3af';
          }))].slice(0, 3);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 tap-target ${
                isSelected
                  ? 'bg-emerald-500 text-white shadow-md'
                  : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700'
              }`}
            >
              <span className="text-sm">{day}</span>
              {categoryColors.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {categoryColors.map((color, ci) => (
                    <div
                      key={ci}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'opacity-80' : ''}`}
                      style={{ backgroundColor: isSelected ? 'white' : color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date tasks */}
      {selectedDate && (
        <div className="animate-slide-up">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          {selectedTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {getRandomMessage(EMPTY_STATE_MESSAGES)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks
                .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
                .map((task) => (
                  <TaskItem key={task.id} task={task} onRefresh={loadMonth} onEdit={handleEditTask} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
