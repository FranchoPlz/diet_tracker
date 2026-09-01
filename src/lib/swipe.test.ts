import { describe, expect, it } from 'vitest';
import { getSwipedTab } from './swipe';

describe('tab swipe navigation', () => {
  it('moves between adjacent tabs only for clear horizontal swipes', () => {
    expect(getSwipedTab('diet', { x: 240, y: 100, target: null }, { x: 120, y: 108 })).toBe('training');
    expect(getSwipedTab('diet', { x: 120, y: 100, target: null }, { x: 240, y: 108 })).toBe('home');
    expect(getSwipedTab('home', { x: 120, y: 100, target: null }, { x: 240, y: 100 })).toBeNull();
    expect(getSwipedTab('diet', { x: 120, y: 100, target: null }, { x: 160, y: 100 })).toBeNull();
    expect(getSwipedTab('diet', { x: 120, y: 100, target: null }, { x: 180, y: 220 })).toBeNull();
  });

  it('does not navigate when a swipe starts on an interactive control', () => {
    const button = document.createElement('button');
    expect(getSwipedTab('diet', { x: 240, y: 100, target: button }, { x: 120, y: 100 })).toBeNull();
  });
});
