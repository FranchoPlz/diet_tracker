import { beforeEach, describe, expect, it } from 'vitest';
import { createShoppingList } from './shopping';
import { buildShareUrl, decodeSharedList, encodeSharedList, readSharedListFromHash } from './share';

describe('shopping list sharing', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => `id-${Math.random()}` }, configurable: true });
  });

  it('round-trips a compressed independent snapshot', () => {
    const original = createShoppingList('Compra', [{ name: 'Leche', quantity: 2, unit: 'l', count: 1 }]);
    const imported = decodeSharedList(encodeSharedList(original));
    expect(imported.name).toBe('Compra (copia)');
    expect(imported.items[0].name).toBe('Leche');
    expect(imported.id).not.toBe(original.id);
    expect(imported.items[0].id).not.toBe(original.items[0].id);
  });

  it('keeps payload in the URL fragment', () => {
    const list = createShoppingList('Compra');
    const url = buildShareUrl(list, 'https://example.com/diet_tracker/');
    expect(new URL(url).search).toBe('');
    expect(readSharedListFromHash(new URL(url).hash)?.name).toBe('Compra (copia)');
  });
});
