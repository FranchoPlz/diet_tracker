import { appState } from './state.svelte';

export function initializePreferences(): void {
  appState.compactView = localStorage.getItem('compactView') === 'true';
  appState.askToModifyDiet = localStorage.getItem('askToModifyDiet') !== 'false';
  appState.autoDay = localStorage.getItem('autoDay') !== 'false';
  setDarkMode(localStorage.getItem('darkMode') !== 'false', false);
}

export function setCompactView(enabled: boolean): void {
  appState.compactView = enabled;
  localStorage.setItem('compactView', String(enabled));
}

export function setAskToModifyDiet(enabled: boolean): void {
  appState.askToModifyDiet = enabled;
  localStorage.setItem('askToModifyDiet', String(enabled));
}

export function setAutoDay(enabled: boolean): void {
  appState.autoDay = enabled;
  localStorage.setItem('autoDay', String(enabled));
}

export function setDarkMode(enabled: boolean, persist = true): void {
  appState.darkMode = enabled;
  document.documentElement.classList.toggle('dark', enabled);
  if (persist) localStorage.setItem('darkMode', String(enabled));
}
