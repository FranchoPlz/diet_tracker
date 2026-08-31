import type { ParseResult, WeekConfig, ShoppingItem } from './types';
import { createDefaultWeekConfig } from './utils';

export const appState = $state({
  parsedData: null as ParseResult | null,
  pdfPath: null as string | null,
  weekConfig: createDefaultWeekConfig(1) as WeekConfig,
  shoppingList: [] as ShoppingItem[],
  checkedShoppingItems: {} as Record<string, boolean>,
  darkMode: false,
  loading: false,
  error: null as string | null,
});
