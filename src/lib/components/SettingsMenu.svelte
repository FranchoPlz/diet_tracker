<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';

  onMount(() => {
    appState.compactView = localStorage.getItem('compactView') === 'true';
  });

  function setCompactView(enabled: boolean) {
    appState.compactView = enabled;
    localStorage.setItem('compactView', String(enabled));
  }
</script>

<details class="relative">
  <summary
    class="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-lg text-stone-500 hover:bg-white hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-white [&::-webkit-details-marker]:hidden"
    aria-label="Ajustes"
    title="Ajustes"
  >
    ⚙
  </summary>

  <div class="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl dark:border-stone-700 dark:bg-stone-900">
    <p class="text-xs font-black uppercase tracking-[0.18em] text-stone-400">Ajustes</p>
    <label class="mt-3 flex cursor-pointer items-start justify-between gap-4 rounded-xl p-2 hover:bg-stone-50 dark:hover:bg-stone-800">
      <span>
        <span class="block text-sm font-bold text-stone-800 dark:text-stone-100">Vista compacta</span>
        <span class="mt-0.5 block text-xs leading-relaxed text-stone-500 dark:text-stone-400">Muestra más días, comidas y productos reduciendo espacios y tamaños.</span>
      </span>
      <input
        type="checkbox"
        aria-label="Vista compacta"
        class="mt-1 size-5 shrink-0 accent-teal-700"
        checked={appState.compactView}
        onchange={(event) => setCompactView(event.currentTarget.checked)}
      />
    </label>
  </div>
</details>
