<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';

  onMount(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== 'false') {
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
  class="grid size-10 place-items-center rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white focus:outline-none"
  aria-label={appState.darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
  title={appState.darkMode ? 'Modo claro' : 'Modo oscuro'}
>
  {#if appState.darkMode}
    ☀
  {:else}
    ☾
  {/if}
</button>
