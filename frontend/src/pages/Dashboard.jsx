import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import { getTasksForDate, getTasksInRange, getOverdueTasks, getStreak, todayStr, formatDate } from '../db';
import TaskItem from '../components/TaskItem';
import { getRandomMessage, EMPTY_STATE_MESSAGES, WEEKEND_MESSAGES, isWeekend } from '../utils/messages';

export default function Dashboard() {
  const { dispatch, konamiActive } = useApp();
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weekendMsg, setWeekendMsg] = useState(null);
  const titleTapRef = useRef(0);

  const loadData = useCallback(async () => {
    const today = todayStr();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [todayData, upcomingData, overdueData, streakData] = await Promise.all([
      getTasksForDate(today),
      getTasksInRange(formatDate(tomorrow), formatDate(weekEnd)),
      getOverdueTasks(),
      getStreak(),
    ]);

    setTodayTasks(todayData);
    setUpcomingTasks(upcomingData.filter((t) => !t.completed));
    setOverdueTasks(overdueData);
    setStreak(streakData);
    setLoading(false);

    if (isWeekend() && Math.random() < 0.5) {
      setWeekendMsg(getRandomMessage(WEEKEND_MESSAGES));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleEditTask(task) {
    dispatch({ type: 'SET_TAB', payload: 'add' });
    // Store the editing task in sessionStorage so AddTask can pick it up
    sessionStorage.setItem('editTask', JSON.stringify(task));
  }

  function handleTitleTap() {
    titleTapRef.current += 1;
    if (titleTapRef.current >= 10) {
      titleTapRef.current = 0;
      dispatch({ type: 'SET_KONAMI', payload: true });
      setTimeout(() => dispatch({ type: 'SET_KONAMI', payload: false }), 5000);
    }
    // Reset after 3s of no taps
    setTimeout(() => { titleTapRef.current = 0; }, 3000);
  }

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold dark:text-white cursor-pointer select-none"
          onClick={handleTitleTap}
        >
          Squeaky Clean ✨
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{todayDate}</p>
      </div>

      {/* Konami Easter Egg */}
      {konamiActive && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-4 mb-4 text-center animate-bounce-in">
          <p className="text-lg font-bold">ULTRA CLEAN MODE ACTIVATED</p>
        </div>
      )}

      {/* Weekend message */}
      {weekendMsg && (
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-2xl p-3 mb-4 text-sm italic">
          {weekendMsg}
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-300">{streak}-day streak!</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Keep it up!</p>
          </div>
        </div>
      )}

      {/* Progress for today */}
      {totalToday > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Today&apos;s progress</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{completedToday}/{totalToday}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedToday / totalToday) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            Overdue ({overdueTasks.length})
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskItem key={task.id} task={task} onRefresh={loadData} onEdit={handleEditTask} showDate />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Today</h2>
        {todayTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-400 dark:text-gray-500 text-sm">{getRandomMessage(EMPTY_STATE_MESSAGES)}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks
              .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
              .map((task) => (
                <TaskItem key={task.id} task={task} onRefresh={loadData} onEdit={handleEditTask} />
              ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Upcoming (next 7 days)
          </h2>
          <div className="space-y-2">
            {upcomingTasks
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((task) => (
                <TaskItem key={task.id} task={task} onRefresh={loadData} onEdit={handleEditTask} showDate />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
