import { appState } from './state.svelte';
import { createShoppingList, normalizeShoppingItem } from './shopping';
import { listShoppingLists, saveShoppingList } from './storage';
import type { SavedShoppingList, ShoppingItem } from './types';

export async function initializeLists(): Promise<void> {
  appState.savedLists = await listShoppingLists();
  appState.persistenceReady = true;
}

export function applyList(list: SavedShoppingList): void {
  appState.activeListId = list.id;
  appState.activeListName = list.name;
  appState.shoppingList = list.items.map(item => ({ ...item }));
  appState.checkedShoppingItems = Object.fromEntries(list.items.map(item => [`${item.name}|${item.unit ?? ''}`, item.checked]));
}

export async function persistCurrentList(): Promise<SavedShoppingList> {
  const existing = appState.savedLists.find(list => list.id === appState.activeListId);
  const list = existing ? structuredClone(existing) : createShoppingList(appState.activeListName);
  list.name = appState.activeListName;
  list.items = appState.shoppingList.map((item: ShoppingItem) => ({
    ...normalizeShoppingItem(item),
    checked: appState.checkedShoppingItems[`${item.name}|${item.unit ?? ''}`] ?? item.checked ?? false,
  }));
  await saveShoppingList(list);
  appState.activeListId = list.id;
  appState.savedLists = await listShoppingLists();
  return list;
}

export async function newStandaloneList(): Promise<void> {
  const list = createShoppingList('Nueva lista');
  await saveShoppingList(list);
  appState.savedLists = await listShoppingLists();
  applyList(list);
}
