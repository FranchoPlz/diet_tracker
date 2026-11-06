<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { findExerciseIllustration } from '$lib/exercise-illustrations';
  import { inferExerciseType, memberTargets, progressKey } from '$lib/training-model';
  import type { ExerciseRow, TrainingDay } from '$lib/types';
  import { repetitionTargets, seriesCount, setExerciseNotes, setProgressValue } from '$lib/week-tracker';
  import { flushWorkspaceAutosave } from '$lib/workspace-controller';

  let { day, exercise, index, visibleIllustrations = $bindable(), onEdit, onRemove }: {
    day: TrainingDay;
    exercise: ExerciseRow;
    index: number;
    /** Guide visibility by progress key; owned by the parent so it survives day switches. */
    visibleIllustrations: Record<string, boolean>;
    onEdit: (exercise: ExerciseRow) => void;
    onRemove: (exercise: ExerciseRow) => void;
  } = $props();

  const names = $derived(exercise.supersetExercises?.length ? exercise.supersetExercises : [exercise.exercise]);
  const exerciseType = $derived(inferExerciseType(exercise));

  function values(key: string, field: 'weight' | 'repetitions') {
    const store = field === 'weight' ? appState.weekTracker.trainingWeights : appState.weekTracker.trainingRepetitions;
    return store?.[key] ?? [];
  }
</script>

<li>
  <details open class="group">
    <summary class="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-6 [&::-webkit-details-marker]:hidden">
      <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-stone-900 text-xs font-black text-white dark:bg-white dark:text-stone-900">{index + 1}</span>
      <div class="min-w-0 flex-1">
        <h3 class="break-words text-lg font-black leading-snug">{exercise.exercise}</h3>
        {#if names.length > 1}
          <p class="mt-1 text-xs font-black uppercase tracking-wide text-warm">Superserie · registros independientes</p>
        {/if}
        {#if exercise.details}
          <p class="mt-1 break-words text-sm text-stone-600 dark:text-stone-300">{exercise.details}</p>
        {/if}
      </div>
      <span class="flex shrink-0 gap-1">
        <button
          type="button"
          class="grid min-h-11 min-w-11 place-items-center rounded-xl text-warm hover:bg-orange-100 dark:hover:bg-orange-950/30"
          onclick={(event) => { event.preventDefault(); event.stopPropagation(); onEdit(exercise); }}
          aria-label={`Editar ${exercise.exercise}`}
        >
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
        <button
          type="button"
          class="grid min-h-11 min-w-11 place-items-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          onclick={(event) => { event.preventDefault(); event.stopPropagation(); onRemove(exercise); }}
          aria-label={`Eliminar ${exercise.exercise}`}
        >
          <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>
          </svg>
        </button>
      </span>
      <span aria-hidden="true" class="pt-2">⌄</span>
    </summary>
    <div class="px-4 pb-4 sm:px-6 sm:pb-6">
      {#each names as name, memberIndex}
        {@const key = progressKey(day, exercise, names.length > 1 ? memberIndex : undefined)}
        {@const count = seriesCount(exercise.series)}
        {@const targets = names.length > 1
          ? memberTargets(exercise.repetitions, count, memberIndex, names.length)
          : repetitionTargets(exercise.repetitions, count)}
        {@const illustration = findExerciseIllustration(name)}
        <div class="mt-4 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700">
          <div class="flex items-center justify-between gap-2 bg-stone-100 px-3 py-2 dark:bg-stone-800">
            <div class="min-w-0">
              <strong class="break-words">{name}</strong>
              <span class="mt-0.5 block text-[11px] font-bold uppercase tracking-wide {illustration ? 'text-warm' : 'text-stone-400'}">
                {illustration ? 'Guía visual disponible' : 'Sin guía visual'}
              </span>
            </div>
            {#if illustration && !appState.alwaysShowExerciseIllustrations}
              <button
                class="min-h-11 rounded-xl px-3 text-xs font-black text-warm"
                aria-label={`${visibleIllustrations[key] ? 'Ocultar' : 'Mostrar'} guía de ${name}`}
                aria-expanded={visibleIllustrations[key] ?? false}
                onclick={() => visibleIllustrations[key] = !visibleIllustrations[key]}
              >
                {visibleIllustrations[key] ? 'Ocultar guía' : 'Ver guía'}
              </button>
            {/if}
          </div>
          {#if illustration && (visibleIllustrations[key] || appState.alwaysShowExerciseIllustrations)}
            <div class="grid grid-cols-3 gap-2 p-3">
              {#each illustration.frameUrls as url, i}
                <img class="aspect-square w-full rounded-xl bg-stone-800 object-contain" src={url} alt={`${name}, posición ${i + 1}`} />
              {/each}
            </div>
          {/if}
          {#if exerciseType === 'cardio'}
            <div class="grid gap-3 p-3 sm:grid-cols-2">
              <label class="text-sm font-bold">
                Duración objetivo
                <input
                  class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
                  value={exercise.duration || exercise.repetitions}
                  readonly
                />
              </label>
              <label class="text-sm font-bold">
                Notas
                <input
                  class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
                  value={appState.weekTracker.exerciseNotes?.[key] ?? ''}
                  oninput={(e) => setExerciseNotes(key, e.currentTarget.value)}
                  onblur={() => void flushWorkspaceAutosave()}
                />
              </label>
            </div>
          {:else}
            <div class="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 bg-stone-100 px-3 py-2 text-xs font-black uppercase text-stone-500 dark:bg-stone-800">
              <span>Serie</span><span>Peso</span><span>Reps hechas</span>
            </div>
            {#each Array(count) as _, seriesIndex}
              <div class="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-t border-stone-200 px-3 py-2 dark:border-stone-700">
                <div>
                  <strong>{seriesIndex + 1}</strong>
                  <small class="block text-stone-500">{targets[seriesIndex]} obj.</small>
                </div>
                <label>
                  <span class="sr-only">{name}, peso serie {seriesIndex + 1}</span>
                  <input
                    type="number"
                    inputmode="decimal"
                    min="0"
                    step="0.5"
                    class="min-h-11 w-full rounded-xl border bg-transparent px-3"
                    value={values(key, 'weight')[seriesIndex] ?? ''}
                    oninput={(e) => setProgressValue(key, 'weight', seriesIndex, e.currentTarget.value)}
                    onblur={() => void flushWorkspaceAutosave()}
                  />
                </label>
                <label>
                  <span class="sr-only">{name}, repeticiones serie {seriesIndex + 1}</span>
                  <input
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="1"
                    class="min-h-11 w-full rounded-xl border bg-transparent px-3"
                    value={values(key, 'repetitions')[seriesIndex] ?? ''}
                    placeholder={targets[seriesIndex]}
                    oninput={(e) => setProgressValue(key, 'repetitions', seriesIndex, e.currentTarget.value)}
                    onblur={() => void flushWorkspaceAutosave()}
                  />
                </label>
              </div>
            {/each}
            <label class="block border-t border-stone-200 p-3 text-sm font-bold dark:border-stone-700">
              Notas
              <input
                class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
                value={appState.weekTracker.exerciseNotes?.[key] ?? exercise.notes ?? ''}
                oninput={(e) => setExerciseNotes(key, e.currentTarget.value)}
                onblur={() => void flushWorkspaceAutosave()}
              />
            </label>
          {/if}
        </div>
      {/each}
    </div>
  </details>
</li>
