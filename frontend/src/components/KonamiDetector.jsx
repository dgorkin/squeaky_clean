import { useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp';

// Konami code: ↑↑↓↓←→←→BA
// On mobile: 10 taps on app title triggers it
const KONAMI = [
  'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
  'b','a',
];

export default function KonamiDetector() {
  const { dispatch } = useApp();
  const keysRef = useRef([]);

  useEffect(() => {
    function handleKey(e) {
      keysRef.current.push(e.key);
      if (keysRef.current.length > KONAMI.length) {
        keysRef.current = keysRef.current.slice(-KONAMI.length);
      }
      if (keysRef.current.length === KONAMI.length &&
        keysRef.current.every((k, i) => k.toLowerCase() === KONAMI[i].toLowerCase())) {
        activateKonami();
        keysRef.current = [];
      }
    }

    function activateKonami() {
      dispatch({ type: 'SET_KONAMI', payload: true });
      setTimeout(() => {
        dispatch({ type: 'SET_KONAMI', payload: false });
      }, 5000);
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch]);

  return null;
}
