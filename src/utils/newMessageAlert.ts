let audio: HTMLAudioElement | null = null;

export function initNewMessageSound() {
  if (audio) return;
  audio = new Audio('/sounds/new-message.mp3');
  audio.preload = 'auto';
  audio.volume = 0.7;
}

/** Desbloquea el audio en el primer toque/click (iOS/Android) */
export function unlockNewMessageSound() {
  initNewMessageSound();
  if (!audio) return;
  const a = audio;
  const prevMuted = a.muted;
  a.muted = true;
  a.currentTime = 0;
  a.play().then(() => {
    a.pause();
    a.muted = prevMuted;
  }).catch(() => {});
}

export function playNewMessageSound() {
  initNewMessageSound();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function vibrate(pattern: number | number[] = [60, 30, 60]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

export function alertNewMessage() {
  playNewMessageSound();
  vibrate([60, 30, 60]);
}
