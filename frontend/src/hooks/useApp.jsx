import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { db, initializeDB, getSetting, setSetting, getAllCategories } from '../db';

const AppContext = createContext(null);

const initialState = {
  activeTab: 'dashboard',
  theme: 'light',
  hapticFeedback: true,
  categories: [],
  initialized: false,
  toast: null,
  milestone: null,
  konamiActive: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_HAPTIC':
      return { ...state, hapticFeedback: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: true };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'SHOW_MILESTONE':
      return { ...state, milestone: action.payload };
    case 'HIDE_MILESTONE':
      return { ...state, milestone: null };
    case 'SET_KONAMI':
      return { ...state, konamiActive: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      await initializeDB();
      const theme = (await getSetting('theme')) || 'light';
      const haptic = await getSetting('hapticFeedback');
      const cats = await getAllCategories();
      dispatch({ type: 'SET_THEME', payload: theme });
      dispatch({ type: 'SET_HAPTIC', payload: haptic !== false });
      dispatch({ type: 'SET_CATEGORIES', payload: cats });
      dispatch({ type: 'SET_INITIALIZED' });
    })();
  }, []);

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-lemon');
    document.body.classList.remove('dark', 'bg-gray-50', 'bg-gray-950', 'text-gray-900', 'text-gray-100', 'theme-lemon');
    if (state.theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark', 'bg-gray-950', 'text-gray-100');
    } else if (state.theme === 'lemon') {
      root.classList.add('theme-lemon');
      document.body.classList.add('theme-lemon', 'bg-gray-50', 'text-gray-900');
    } else {
      document.body.classList.add('bg-gray-50', 'text-gray-900');
    }
  }, [state.theme]);

  const showToast = useCallback((message) => {
    dispatch({ type: 'SHOW_TOAST', payload: message });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 2500);
  }, []);

  const showMilestone = useCallback((milestone) => {
    dispatch({ type: 'SHOW_MILESTONE', payload: milestone });
  }, []);

  const refreshCategories = useCallback(async () => {
    const cats = await getAllCategories();
    dispatch({ type: 'SET_CATEGORIES', payload: cats });
  }, []);

  const setTheme = useCallback(async (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
    await setSetting('theme', theme);
  }, []);

  const setHaptic = useCallback(async (enabled) => {
    dispatch({ type: 'SET_HAPTIC', payload: enabled });
    await setSetting('hapticFeedback', enabled);
  }, []);

  const value = {
    ...state,
    dispatch,
    showToast,
    showMilestone,
    refreshCategories,
    setTheme,
    setHaptic,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
