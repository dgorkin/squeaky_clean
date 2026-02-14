export const COMPLETION_MESSAGES = [
  '✨ Sparkling!',
  "That's the stuff!",
  'Your future self thanks you!',
  'One less thing™',
  'Look at you go!',
  'Squeaky clean!',
  'Nailed it!',
  'Fresh as a daisy!',
  'You make it look easy!',
  'Another one bites the dust!',
  'Clean machine!',
  'Spotless!',
];

export const EMPTY_STATE_MESSAGES = [
  'Nothing to clean! Go put your feet up 🛋️',
  "All clear! This house isn't going to relax in itself",
  "Zero tasks. You either cleaned everything or you're in denial 🤷",
  'A clean slate! Literally.',
  'No tasks here. Suspicious... 🧐',
  'Free as a bird! A very clean bird.',
];

export const WEEKEND_MESSAGES = [
  'A clean house is a happy house — but so is a house where someone took a nap instead. Balance.',
  'Weekend mode: activated. Cleaning mode: optional.',
  "It's the weekend! Clean if you want, nap if you don't.",
  'Saturday vibes: do one thing, feel like a hero.',
];

export const MILESTONES = [
  { count: 10, badge: 'Dust Buster 🏆', message: '10 tasks completed! You\'re on a roll!' },
  { count: 25, badge: 'Tidy Titan 💪', message: '25 tasks! This house has never looked better.' },
  { count: 50, badge: 'Clean Machine 🤖', message: '50 tasks! You are unstoppable!' },
  { count: 100, badge: 'Domestic Legend 👑', message: '100 tasks! You are the undisputed champion of clean.' },
  { count: 250, badge: 'Spotless Sovereign ✨', message: '250 tasks! Your house could be in a magazine.' },
  { count: 500, badge: 'Immaculate Icon 🌟', message: '500 tasks! We bow to your cleanliness.' },
];

export function getRandomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getMilestone(count) {
  return MILESTONES.find((m) => m.count === count);
}

export function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}
