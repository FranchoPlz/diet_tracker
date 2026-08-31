import type { ParseResult, WeekConfig, ShoppingItem, SavedShoppingList } from './types';
import { createDefaultWeekConfig } from './utils';

export const appState = $state({
  parsedData: null as ParseResult | null,
  pdfPath: null as string | null,
  weekConfig: createDefaultWeekConfig(1) as WeekConfig,
  shoppingList: [] as ShoppingItem[],
  checkedShoppingItems: {} as Record<string, boolean>,
  activeListId: null as string | null,
  activeListName: 'Lista de la semana',
  savedLists: [] as SavedShoppingList[],
  persistenceReady: false,
  darkMode: false,
  loading: false,
  error: null as string | null,
});
