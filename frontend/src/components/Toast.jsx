import React from 'react';
import { useApp } from '../hooks/useApp';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
      <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-semibold whitespace-nowrap">
        {toast}
      </div>
    </div>
  );
}
