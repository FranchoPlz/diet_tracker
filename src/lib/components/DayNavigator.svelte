<script lang="ts">
  import { appState } from '$lib/state.svelte';

  let { onSelect, onNext } = $props<{
    onSelect: (dayIndex: number) => void;
    onNext: () => void;
  }>();

  const names = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
</script>

<section class="app-surface sticky top-2 z-10 rounded-2xl border p-3" aria-label="Navegación de la semana">
  <div class="mb-3 flex items-center justify-between gap-3">
    <div>
      <p class="text-[0.65rem] font-black uppercase tracking-[0.18em] text-orange-600">Semana {appState.weekTracker.weekNumber}</p>
      <p class="text-lg font-black text-stone-950 dark:text-white">Día {appState.weekTracker.activeDayIndex + 1} de 7</p>
    </div>
    <button type="button" class="app-accent-button min-h-11 rounded-xl px-4 text-sm font-black" onclick={onNext}>
      {appState.weekTracker.activeDayIndex === 6 ? 'Cerrar semana' : 'Siguiente día'}
    </button>
  </div>
  <div class="grid grid-cols-7 gap-1.5">
    {#each names as name, index}
      <button
        type="button"
        class="min-h-11 rounded-xl border text-sm font-black {index === appState.weekTracker.activeDayIndex ? 'border-orange-500 bg-orange-100 text-orange-800' : 'border-stone-200 bg-white text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'}"
        aria-label={`Ir al día ${index + 1}`}
        aria-pressed={index === appState.weekTracker.activeDayIndex}
        onclick={() => onSelect(index)}
      >
        <span class="block text-[0.6rem] opacity-70">{name}</span>{index + 1}
      </button>
    {/each}
  </div>
</section>
