import { strFromU8, strToU8, zlibSync, unzlibSync } from 'fflate';
import type { SavedShoppingList } from './types';
import { createShoppingList, isSavedShoppingList } from './shopping';

interface ListEnvelope {
  kind: 'diet-shopping-list';
  schemaVersion: 1;
  exportedAt: string;
  list: SavedShoppingList;
}

const MAX_SHARED_LIST_LENGTH = 100_000;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

export function createListEnvelope(list: SavedShoppingList): ListEnvelope {
  return { kind: 'diet-shopping-list', schemaVersion: 1, exportedAt: new Date().toISOString(), list };
}

export function encodeSharedList(list: SavedShoppingList): string {
  return base64Url(zlibSync(strToU8(JSON.stringify(createListEnvelope(list)))));
}

export function decodeSharedList(encoded: string): SavedShoppingList {
  if (encoded.length > MAX_SHARED_LIST_LENGTH) throw new Error('La lista compartida es demasiado grande.');
  const envelope = JSON.parse(strFromU8(unzlibSync(fromBase64Url(encoded)))) as Partial<ListEnvelope>;
  if (envelope.kind !== 'diet-shopping-list' || envelope.schemaVersion !== 1 || !isSavedShoppingList(envelope.list)) {
    throw new Error('La lista compartida no tiene un formato válido.');
  }
  const imported = createShoppingList(`${envelope.list.name} (copia)`, envelope.list.items);
  imported.items = imported.items.map(item => ({ ...item, id: crypto.randomUUID() }));
  return imported;
}

export function buildShareUrl(list: SavedShoppingList, currentUrl: string): string {
  const url = new URL(currentUrl);
  url.hash = `share=${encodeSharedList(list)}`;
  return url.toString();
}

export function readSharedListFromHash(hash: string): SavedShoppingList | null {
  const match = hash.match(/^#?share=(.+)$/);
  return match ? decodeSharedList(match[1]) : null;
}

export function parseListFile(content: string): SavedShoppingList {
  const envelope = JSON.parse(content) as Partial<ListEnvelope>;
  if (envelope.kind !== 'diet-shopping-list' || !isSavedShoppingList(envelope.list)) {
    throw new Error('El archivo no contiene una lista compatible.');
  }
  return decodeSharedList(encodeSharedList(envelope.list));
}
