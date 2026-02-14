export function triggerHaptic(enabled) {
  if (enabled && navigator.vibrate) {
    navigator.vibrate(15);
  }
}
