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
    class="grid size-10 cursor-pointer list-none place-items-center rounded-full text-lg hover:opacity-90 [&::-webkit-details-marker]:hidden"
    style="color: var(--text-secondary); background: color-mix(in srgb, var(--surface-strong) 70%, transparent);"
    aria-label="Ajustes"
    title="Ajustes"
  >
    ⚙
  </summary>

  <div class="app-surface fixed inset-x-4 bottom-18 z-50 rounded-3xl border p-4 sm:absolute sm:inset-x-auto sm:bottom-12 sm:right-0 sm:w-72">
    <p class="text-xs font-black uppercase tracking-[0.18em]" style="color: var(--text-muted);">Ajustes</p>
    <label class="mt-3 flex cursor-pointer items-start justify-between gap-4 rounded-2xl p-2 hover:opacity-90" style="background: color-mix(in srgb, var(--surface-strong) 58%, transparent);">
      <span>
        <span class="block text-sm font-bold" style="color: var(--text-primary);">Vista compacta</span>
        <span class="mt-0.5 block text-xs leading-relaxed" style="color: var(--text-muted);">Muestra más días, comidas y productos reduciendo espacios y tamaños.</span>
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
