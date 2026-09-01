<script lang="ts">
  import SettingsMenu from './SettingsMenu.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<div class="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-stone-200 bg-white/95 p-1 shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95" aria-label="Preferencias">
  <SettingsMenu />
  <span class="h-5 w-px bg-stone-200 dark:bg-stone-700"></span>
  <ThemeToggle />
</div>
