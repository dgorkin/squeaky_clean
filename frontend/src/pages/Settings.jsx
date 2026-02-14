import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import {
  getAllCategories, addCategory, updateCategory, deleteCategory,
  exportAllData, importData, getAchievements, getSetting,
} from '../db';
import { MILESTONES } from '../utils/messages';

export default function Settings() {
  const { theme, hapticFeedback, setTheme, setHaptic, refreshCategories, categories, showToast } = useApp();
  const [achievements, setAchievements] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏠');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [editingCat, setEditingCat] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const ach = await getAchievements();
      const total = await getSetting('totalCompleted');
      setAchievements(ach);
      setTotalCompleted(total || 0);
    })();
  }, []);

  async function handleExport() {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squeaky-clean-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported!');
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      await refreshCategories();
      showToast('Data imported!');
    } catch (err) {
      showToast('Import failed: Invalid file');
    }
    e.target.value = '';
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    await addCategory({ name: newCatName.trim(), icon: newCatIcon, color: newCatColor });
    setNewCatName('');
    setNewCatIcon('🏠');
    setNewCatColor('#10b981');
    await refreshCategories();
  }

  async function handleUpdateCategory(id) {
    if (!editingCat) return;
    await updateCategory(id, {
      name: editingCat.name,
      icon: editingCat.icon,
      color: editingCat.color,
    });
    setEditingCat(null);
    await refreshCategories();
  }

  async function handleDeleteCategory(id) {
    await deleteCategory(id);
    await refreshCategories();
  }

  const sectionClass = 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden';
  const rowClass = 'flex items-center justify-between px-4 py-3.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0';

  return (
    <div className="px-4 pt-4 pb-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold dark:text-white mb-4">Settings</h1>

      {/* Appearance */}
      <div className={sectionClass}>
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Appearance</h2>
        </div>
        <div className={rowClass}>
          <span className="text-sm dark:text-white">Theme</span>
          <div className="flex gap-1.5">
            {[
              { value: 'light', label: '☀️', title: 'Light' },
              { value: 'dark', label: '🌙', title: 'Dark' },
              { value: 'lemon', label: '🍋', title: 'Lemon Fresh' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                title={t.title}
                className={`px-3 py-1.5 rounded-lg text-sm tap-target transition-all ${
                  theme === t.value
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className={rowClass}>
          <span className="text-sm dark:text-white">Haptic Feedback</span>
          <button
            onClick={() => setHaptic(!hapticFeedback)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              hapticFeedback ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
              hapticFeedback ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className={sectionClass}>
        <button
          onClick={() => setShowCategoryManager(!showCategoryManager)}
          className={`${rowClass} w-full`}
        >
          <span className="text-sm dark:text-white">Manage Categories</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryManager ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
        {showCategoryManager && (
          <div className="px-4 py-3 space-y-2 border-t border-gray-50 dark:border-gray-700/50">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                {editingCat?.id === cat.id ? (
                  <>
                    <input
                      value={editingCat.icon}
                      onChange={(e) => setEditingCat({ ...editingCat, icon: e.target.value })}
                      className="w-10 text-center bg-gray-100 dark:bg-gray-700 rounded py-1 text-sm"
                    />
                    <input
                      value={editingCat.name}
                      onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-sm dark:text-white"
                    />
                    <input
                      type="color"
                      value={editingCat.color}
                      onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => handleUpdateCategory(cat.id)}
                      className="text-emerald-500 text-xs font-medium"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm">{cat.icon}</span>
                    <span className="flex-1 text-sm dark:text-white">{cat.name}</span>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <button
                      onClick={() => setEditingCat({ ...cat })}
                      className="text-gray-400 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-400 text-xs"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
            {/* Add new */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <input
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-10 text-center bg-gray-100 dark:bg-gray-700 rounded py-1 text-sm"
                placeholder="🏠"
              />
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-sm dark:text-white"
                placeholder="New category"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <button
                onClick={handleAddCategory}
                className="text-emerald-500 text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data */}
      <div className={sectionClass}>
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</h2>
        </div>
        <button onClick={handleExport} className={`${rowClass} w-full text-left`}>
          <span className="text-sm dark:text-white">Export Backup (JSON)</span>
          <span className="text-gray-400">↗</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`${rowClass} w-full text-left`}
        >
          <span className="text-sm dark:text-white">Import Backup</span>
          <span className="text-gray-400">↙</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Achievements */}
      <div className={sectionClass}>
        <button
          onClick={() => setShowAchievements(!showAchievements)}
          className={`${rowClass} w-full`}
        >
          <span className="text-sm dark:text-white">Achievements</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{achievements.length} unlocked</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAchievements ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>
        {showAchievements && (
          <div className="px-4 py-3 space-y-2 border-t border-gray-50 dark:border-gray-700/50">
            {MILESTONES.map((milestone) => {
              const unlocked = achievements.find((a) => a.key === milestone.badge);
              return (
                <div
                  key={milestone.badge}
                  className={`flex items-center gap-3 py-2 ${!unlocked ? 'opacity-30' : ''}`}
                >
                  <span className="text-2xl">{milestone.badge.slice(-2)}</span>
                  <div>
                    <p className="text-sm font-medium dark:text-white">{milestone.badge}</p>
                    <p className="text-xs text-gray-400">Complete {milestone.count} tasks</p>
                  </div>
                  {unlocked && (
                    <span className="ml-auto text-[10px] text-emerald-500 font-medium">✓ Unlocked</span>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-gray-400 pt-2">
              Total tasks completed: {totalCompleted}
            </p>
          </div>
        )}
      </div>

      {/* About */}
      <div className={sectionClass}>
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">About</h2>
        </div>
        <div className="px-4 py-4 text-center">
          <div className="text-4xl mb-2">🏠✨</div>
          <h3 className="font-bold dark:text-white">Squeaky Clean</h3>
          <p className="text-xs text-gray-400 mt-1">Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-2">
            A house cleaning task tracker that makes tidying up a little more fun.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Built with React, Tailwind CSS, and a love of clean countertops.
          </p>
        </div>
      </div>
    </div>
  );
}
