import type { AppTab } from './types';

const TABS: AppTab[] = ['home', 'diet', 'training', 'shopping'];
const MIN_DISTANCE = 56;

export function swipeTargetIsInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('button, input, select, textarea, summary, a, label');
}

export function getSwipedTab(
  activeTab: AppTab,
  start: { x: number; y: number; target: EventTarget | null },
  end: { x: number; y: number },
): AppTab | null {
  const distanceX = end.x - start.x;
  const distanceY = end.y - start.y;
  if (swipeTargetIsInteractive(start.target) || Math.abs(distanceX) < MIN_DISTANCE || Math.abs(distanceX) < Math.abs(distanceY)) {
    return null;
  }
  return TABS[TABS.indexOf(activeTab) + (distanceX < 0 ? 1 : -1)] ?? null;
}
