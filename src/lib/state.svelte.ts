import type { AppTab, ParseResult, WeekConfig, ShoppingListItem, SavedPlan, SavedShoppingList } from './types';
import { createDefaultWeekConfig, createWeekTracker } from './utils';

export const appState = $state({
  parsedData: null as ParseResult | null,
  weekConfig: createDefaultWeekConfig() as WeekConfig,
  weekTracker: createWeekTracker(),
  shoppingList: [] as ShoppingListItem[],
  activeListId: null as string | null,
  activeListName: 'Lista de la semana',
  savedLists: [] as SavedShoppingList[],
  activePlanId: null as string | null,
  activePlanName: 'Mi plan semanal',
  configured: false,
  activeTab: 'home' as AppTab,
  savedPlans: [] as SavedPlan[],
  persistenceReady: false,
  darkMode: false,
  compactView: false,
  askToModifyDiet: true,
  autoDay: true,
  alwaysShowExerciseIllustrations: true,
  loading: false,
  error: null as string | null,
  saveStatus: 'saved' as 'saved' | 'saving' | 'error',
  toast: null as string | null,
});
