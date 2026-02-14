import React from 'react';
import { useApp } from '../hooks/useApp';

export default function MilestoneModal() {
  const { milestone, dispatch } = useApp();
  if (!milestone) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] animate-fade-in"
      onClick={() => dispatch({ type: 'HIDE_MILESTONE' })}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 mx-6 text-center animate-bounce-in shadow-2xl max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Achievement Unlocked!</h2>
        <div className="text-3xl mb-3">{milestone.badge}</div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{milestone.message}</p>
        <button
          onClick={() => dispatch({ type: 'HIDE_MILESTONE' })}
          className="bg-emerald-500 text-white px-8 py-3 rounded-full font-semibold tap-target active:scale-95 transition-transform"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
