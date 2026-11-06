import { appState } from './state.svelte';
import { createShoppingList } from './shopping';
import { deleteShoppingList, listShoppingLists, saveShoppingList } from './storage';
import type { SavedShoppingList } from './types';
import { cloneData } from './utils';

export async function initializeLists(): Promise<void> {
  appState.savedLists = await listShoppingLists();
}

export function applyList(list: SavedShoppingList): void {
  appState.activeListId = list.id;
  appState.activeListName = list.name;
  appState.shoppingList = list.items.map(item => ({ ...item }));
}

export async function persistCurrentList(): Promise<SavedShoppingList> {
  const existing = appState.savedLists.find(list => list.id === appState.activeListId);
  const list = existing ? cloneData(existing) : createShoppingList(appState.activeListName);
  list.name = appState.activeListName;
  list.items = cloneData(appState.shoppingList);
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

export async function removeShoppingList(id: string): Promise<void> {
  await deleteShoppingList(id);
  if (appState.activeListId === id) {
    appState.activeListId = null;
    appState.activeListName = 'Lista de la semana';
    appState.shoppingList = [];
  }
  appState.savedLists = await listShoppingLists();
}
