import { describe, expect, it } from 'vitest';

import { inferCategory } from './shopping';

describe('shopping categories', () => {
  it('places eggs in dairy and eggs', () => {
    expect(inferCategory('Huevos plancha')).toBe('Lácteos y huevos');
  });
});
