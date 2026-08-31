import type { ParseResult, WeekConfig, ShoppingItem, SavedPlan, SavedShoppingList } from './types';
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
  activePlanId: null as string | null,
  activePlanName: 'Mi plan semanal',
  configured: false,
  activeTab: 'diet' as 'diet' | 'training' | 'shopping',
  savedPlans: [] as SavedPlan[],
  planSourceLabel: null as string | null,
  persistenceReady: false,
  darkMode: false,
  compactView: false,
  loading: false,
  error: null as string | null,
});
