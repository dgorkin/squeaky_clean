import Dexie from 'dexie';

export const db = new Dexie('SqueakyCleanDB');

db.version(1).stores({
  tasks: '++id, title, category, dueDate, completed, priority, seriesId, createdAt',
  categories: '++id, name, color, icon, order',
  achievements: '++id, key, unlockedAt',
  settings: 'key',
  completionLog: '++id, date, taskId',
});

// Default categories
const DEFAULT_CATEGORIES = [
  { name: 'Kitchen', color: '#f59e0b', icon: '🍳', order: 0 },
  { name: 'Bathroom', color: '#3b82f6', icon: '🚿', order: 1 },
  { name: 'Bedroom', color: '#8b5cf6', icon: '🛏️', order: 2 },
  { name: 'Living Room', color: '#10b981', icon: '🛋️', order: 3 },
  { name: 'Outdoor', color: '#22c55e', icon: '🌿', order: 4 },
  { name: 'Laundry', color: '#06b6d4', icon: '👕', order: 5 },
  { name: 'Garage', color: '#6b7280', icon: '🔧', order: 6 },
  { name: 'General', color: '#ec4899', icon: '🏠', order: 7 },
];

const DEFAULT_SETTINGS = [
  { key: 'hapticFeedback', value: true },
  { key: 'theme', value: 'light' },
  { key: 'totalCompleted', value: 0 },
];

// Initialize defaults on first load
export async function initializeDB() {
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
  for (const setting of DEFAULT_SETTINGS) {
    const existing = await db.settings.get(setting.key);
    if (!existing) {
      await db.settings.put(setting);
    }
  }
}

// Task helpers
export async function addTask(task) {
  return db.tasks.add({
    ...task,
    completed: false,
    createdAt: new Date().toISOString(),
  });
}

export async function completeTask(taskId) {
  const task = await db.tasks.get(taskId);
  if (!task) return;

  await db.tasks.update(taskId, { completed: true, completedAt: new Date().toISOString() });
  await db.completionLog.add({ date: todayStr(), taskId });

  // Update total completed
  const setting = await db.settings.get('totalCompleted');
  const total = (setting?.value || 0) + 1;
  await db.settings.put({ key: 'totalCompleted', value: total });

  // Generate next occurrence for recurring tasks
  if (task.recurrence && task.recurrence !== 'none') {
    const nextDate = getNextOccurrence(task.dueDate, task.recurrence, task.customInterval);
    if (nextDate) {
      await db.tasks.add({
        title: task.title,
        notes: task.notes,
        category: task.category,
        dueDate: nextDate,
        priority: task.priority,
        recurrence: task.recurrence,
        customInterval: task.customInterval,
        seriesId: task.seriesId || taskId,
        completed: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return total;
}

export async function uncompleteTask(taskId) {
  await db.tasks.update(taskId, { completed: false, completedAt: undefined });
  const setting = await db.settings.get('totalCompleted');
  const total = Math.max(0, (setting?.value || 1) - 1);
  await db.settings.put({ key: 'totalCompleted', value: total });
}

export async function deleteTask(taskId) {
  await db.tasks.delete(taskId);
}

export async function deleteSeries(seriesId) {
  await db.tasks.where('seriesId').equals(seriesId).delete();
  // Also delete the original task if it is the series root
  const original = await db.tasks.get(seriesId);
  if (original) await db.tasks.delete(seriesId);
}

export async function updateTask(taskId, changes) {
  await db.tasks.update(taskId, changes);
}

export async function getTasksForDate(dateStr) {
  return db.tasks.where('dueDate').equals(dateStr).toArray();
}

export async function getTasksInRange(startDate, endDate) {
  return db.tasks
    .where('dueDate')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getOverdueTasks() {
  const today = todayStr();
  return db.tasks
    .where('dueDate')
    .below(today)
    .filter((t) => !t.completed)
    .toArray();
}

export async function getSetting(key) {
  const s = await db.settings.get(key);
  return s?.value;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

export async function getAllCategories() {
  return db.categories.orderBy('order').toArray();
}

export async function addCategory(cat) {
  const count = await db.categories.count();
  return db.categories.add({ ...cat, order: count });
}

export async function updateCategory(id, changes) {
  return db.categories.update(id, changes);
}

export async function deleteCategory(id) {
  return db.categories.delete(id);
}

export async function getAchievements() {
  return db.achievements.toArray();
}

export async function unlockAchievement(key) {
  const existing = await db.achievements.where('key').equals(key).first();
  if (!existing) {
    await db.achievements.add({ key, unlockedAt: new Date().toISOString() });
    return true; // newly unlocked
  }
  return false;
}

// Calculate streak
export async function getStreak() {
  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  // Check if today has tasks & all are done
  const todayTasks = await getTasksForDate(todayStr());
  const todayAllDone = todayTasks.length > 0 && todayTasks.every((t) => t.completed);

  if (todayAllDone) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (todayTasks.length > 0) {
    // Today has uncompleted tasks — streak only from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // No tasks today — check yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Walk backwards
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(checkDate);
    const tasks = await getTasksForDate(dateStr);
    if (tasks.length === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue; // No tasks that day, skip
    }
    if (tasks.every((t) => t.completed)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function exportAllData() {
  const tasks = await db.tasks.toArray();
  const categories = await db.categories.toArray();
  const achievements = await db.achievements.toArray();
  const settings = await db.settings.toArray();
  return { tasks, categories, achievements, settings, exportedAt: new Date().toISOString() };
}

export async function importData(data) {
  await db.transaction('rw', db.tasks, db.categories, db.achievements, db.settings, async () => {
    if (data.tasks) {
      await db.tasks.clear();
      await db.tasks.bulkAdd(data.tasks.map(({ id, ...t }) => t));
    }
    if (data.categories) {
      await db.categories.clear();
      await db.categories.bulkAdd(data.categories.map(({ id, ...c }) => c));
    }
    if (data.achievements) {
      await db.achievements.clear();
      await db.achievements.bulkAdd(data.achievements.map(({ id, ...a }) => a));
    }
    if (data.settings) {
      await db.settings.clear();
      await db.settings.bulkAdd(data.settings);
    }
  });
}

// Date helpers
export function todayStr() {
  return formatDate(new Date());
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNextOccurrence(dueDateStr, recurrence, customInterval) {
  const date = new Date(dueDateStr + 'T12:00:00');
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'custom':
      if (customInterval && customInterval > 0) {
        date.setDate(date.getDate() + customInterval);
      } else {
        return null;
      }
      break;
    default:
      return null;
  }
  return formatDate(date);
}
