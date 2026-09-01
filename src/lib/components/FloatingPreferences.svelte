<script lang="ts">
  import SettingsMenu from './SettingsMenu.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<div class="app-surface fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border p-1" aria-label="Preferencias">
  <SettingsMenu />
  <span class="h-5 w-px" style="background: var(--border);"></span>
  <ThemeToggle />
</div>
