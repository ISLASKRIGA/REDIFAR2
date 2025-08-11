let audio: HTMLAudioElement | null = null;

export function initNewMessageSound() {
  if (audio) return;
  audio = new Audio('/sounds/new-message.mp3');
  audio.preload = 'auto';
  audio.volume = 0.7;
}

/** Desbloquea el audio en iOS/Android: se llama en el primer toque/click del usuario */
export function unlockNewMessageSound() {
  try {
    initNewMessageSound();
    if (!audio) return;
    const a = audio;
    const prevMuted = a.muted;
    a.muted = true;
    a.currentTime = 0;
    a.play()
      .then(() => {
        a.pause();
        a.muted = prevMuted;
      })
      .catch(() => {/* ignorar */});
  } catch {/* ignorar */}
}

export function playNewMessageSound() {
  try {
    initNewMessageSound();
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {/* navegador bloqueó el autoplay */});
  } catch {/* ignorar */}
}

export function vibrate(pattern: number | number[] = [70, 40, 120]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/** Llama a sonido + vibración */
export function alertNewMessage() {
  playNewMessageSound();
  vibrate([60, 30, 60]);
}
