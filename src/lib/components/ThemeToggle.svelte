<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';

  onMount(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
      appState.darkMode = true;
    } else {
      document.documentElement.classList.remove('dark');
      appState.darkMode = false;
    }
  });

  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    appState.darkMode = isDark;
    localStorage.setItem('darkMode', String(isDark));
  }
</script>

<button
  type="button"
  onclick={toggle}
  class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2 rounded-md"
  aria-label={appState.darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
  title={appState.darkMode ? 'Modo claro' : 'Modo oscuro'}
>
  {#if appState.darkMode}
    ☀
  {:else}
    ☾
  {/if}
</button>