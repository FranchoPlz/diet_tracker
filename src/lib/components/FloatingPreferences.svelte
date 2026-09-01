<script lang="ts">
  import SettingsMenu from './SettingsMenu.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<div class="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/95 p-1 shadow-lg shadow-black/40 backdrop-blur" aria-label="Preferencias">
  <SettingsMenu />
  <span class="h-5 w-px bg-zinc-700"></span>
  <ThemeToggle />
</div>
