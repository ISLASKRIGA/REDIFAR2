import { useRef, useCallback } from 'react';

type SwipeOptions = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  minDistance?: number; // píxeles
  enabled?: boolean;
};

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 50,
  enabled = true,
}: SwipeOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    const t = e.changedTouches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }, [enabled]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || touchStartX.current === null || touchStartY.current === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;

    // Evitar disparar si el gesto es principalmente vertical
    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx <= -minDistance) onSwipeLeft();
    if (dx >=  minDistance) onSwipeRight();

    touchStartX.current = null;
    touchStartY.current = null;
  }, [enabled, minDistance, onSwipeLeft, onSwipeRight]);

  // Devuelve props para esparcir en el contenedor
  return {
    onTouchStart,
    onTouchEnd,
  };
}
