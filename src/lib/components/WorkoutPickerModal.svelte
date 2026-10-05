<script lang="ts">
  import { onMount } from 'svelte';
  import type { TrainingDayType } from '$lib/types';

  let { dayName, currentTitle, templates, onSelectTemplate, onCreate, onClose } = $props<{
    dayName: string;
    currentTitle: string;
    templates: Array<{ index: number; title: string; exerciseCount: number; activeRest: boolean }>;
    onSelectTemplate: (index: number) => void;
    onCreate: (type: TrainingDayType) => void;
    onClose: () => void;
  }>();

  onMount(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
  <dialog open class="app-surface m-0 max-h-[calc(100dvh-env(safe-area-inset-top)-0.5rem)] w-full max-w-none overflow-y-auto rounded-t-3xl border px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-inherit shadow-2xl sm:m-auto sm:max-w-2xl sm:rounded-3xl sm:p-6" aria-labelledby="workout-picker-title">
    <div class="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-600 sm:hidden"></div>
    <header class="mb-5 flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{dayName}</p>
        <h2 id="workout-picker-title" class="text-2xl font-black">Cambiar entrenamiento</h2>
        <p class="mt-1 text-sm text-stone-500">Ahora: <strong class="text-stone-800 dark:text-stone-200">{currentTitle}</strong></p>
      </div>
      <button type="button" class="grid min-h-11 min-w-11 place-items-center rounded-full border border-stone-300 text-xl font-black dark:border-stone-600" onclick={onClose} aria-label="Cerrar selector">×</button>
    </header>

    <section aria-labelledby="pdf-routines-title">
      <div class="mb-2 flex items-end justify-between gap-3">
        <h3 id="pdf-routines-title" class="font-black">Rutinas de tu PDF</h3>
        <span class="text-xs font-bold text-stone-400">{templates.length} disponibles</span>
      </div>
      <div class="grid gap-2 sm:grid-cols-2">
        {#each templates as template}
          {@const selected = template.title.toLocaleLowerCase('es') === currentTitle.trim().toLocaleLowerCase('es')}
          <button type="button" class="flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition {selected ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:bg-orange-950/30' : 'border-stone-200 bg-white hover:border-orange-300 dark:border-stone-700 dark:bg-stone-800'}" aria-pressed={selected} onclick={() => onSelectTemplate(template.index)}>
            <span class="grid size-11 shrink-0 place-items-center rounded-xl {template.activeRest ? 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'}">
              {#if template.activeRest}<span class="text-lg" aria-hidden="true">−</span>{:else}<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" /></svg>{/if}
            </span>
            <span class="min-w-0 flex-1"><span class="block truncate font-black">{template.title}</span><span class="mt-0.5 block text-xs text-stone-500">{template.activeRest ? 'Día de descanso' : `${template.exerciseCount} ${template.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}`}</span></span>
            {#if selected}<span class="grid size-6 shrink-0 place-items-center rounded-full bg-orange-600 text-xs font-black text-white" aria-hidden="true">✓</span>{/if}
          </button>
        {/each}
      </div>
    </section>

    <section class="mt-6 border-t border-stone-200 pt-5 dark:border-stone-700" aria-labelledby="new-day-title">
      <h3 id="new-day-title" class="font-black">Crear un día nuevo</h3>
      <p class="mt-1 text-xs text-stone-500">Empieza desde cero sin modificar las rutinas originales del PDF.</p>
      <div class="mt-3 grid grid-cols-3 gap-2">
        <button type="button" class="min-h-20 rounded-2xl border border-stone-200 bg-white p-2 text-center text-xs font-black dark:border-stone-700 dark:bg-stone-800" onclick={() => onCreate('cardio')}><span class="mx-auto mb-1 grid size-8 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40">♥</span>Cardio</button>
        <button type="button" class="min-h-20 rounded-2xl border border-stone-200 bg-white p-2 text-center text-xs font-black dark:border-stone-700 dark:bg-stone-800" onclick={() => onCreate('rest')}><span class="mx-auto mb-1 grid size-8 place-items-center rounded-full bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-200">−</span>Descanso</button>
        <button type="button" class="min-h-20 rounded-2xl border border-stone-200 bg-white p-2 text-center text-xs font-black dark:border-stone-700 dark:bg-stone-800" onclick={() => onCreate('custom')}><span class="mx-auto mb-1 grid size-8 place-items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">＋</span>Personalizado</button>
      </div>
    </section>
  </dialog>
</div>
