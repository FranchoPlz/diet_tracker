<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { downloadTrainingPdf } from '$lib/training-export';
  import { inferExerciseType } from '$lib/training-model';
  import type { ExerciseRow, ExerciseType } from '$lib/types';
  import { flushWorkspaceAutosave, saveWorkspaceNow, scheduleWorkspaceAutosave } from '$lib/workspace-controller';
  import CardioForm from './CardioForm.svelte';
  import ExerciseCard from './ExerciseCard.svelte';
  import ExerciseEditorModal from './ExerciseEditorModal.svelte';

  const training = $derived(appState.parsedData?.training);
  const dayIndex = $derived(appState.weekTracker.activeDayIndex);
  const day = $derived(training?.days[dayIndex]);
  let showExerciseForm = $state(false);
  let editingExerciseId = $state<string | null>(null);
  let editingExistingExercise = $state(false);
  let editingExerciseIndex = $state<number | null>(null);
  let editingDayId = $state<string | null>(null);
  let draft = $state({ exercise: '', type: 'strength' as ExerciseType, series: '3', repetitions: '', duration: '', details: '', notes: '' });
  let visibleIllustrations = $state<Record<string, boolean>>({});

  function openNewExercise() {
    editingExerciseId = null;
    editingExistingExercise = false;
    editingExerciseIndex = null;
    editingDayId = day?.id ?? null;
    draft = { exercise: '', type: day?.type === 'cardio' ? 'cardio' : 'strength', series: '3', repetitions: '', duration: '', details: '', notes: '' };
    showExerciseForm = true;
  }
  function editExercise(exercise: ExerciseRow) {
    editingExerciseId = exercise.id ?? null;
    editingExistingExercise = true;
    editingExerciseIndex = day?.exercises.indexOf(exercise) ?? null;
    editingDayId = day?.id ?? null;
    draft = {
      exercise: exercise.exercise,
      type: inferExerciseType(exercise),
      series: exercise.series,
      repetitions: exercise.repetitions,
      duration: exercise.duration ?? '',
      details: exercise.details,
      notes: exercise.notes ?? ''
    };
    showExerciseForm = true;
  }
  function saveExercise() {
    if (!day || editingDayId !== (day.id ?? null) || !draft.exercise.trim()) return;
    const index = editingExerciseId
      ? day.exercises.findIndex(item => item.id === editingExerciseId)
      : (editingExerciseIndex ?? -1);
    const previous = index >= 0 ? day.exercises[index] : undefined;
    const exercise: ExerciseRow = {
      ...previous,
      id: editingExerciseId ?? crypto.randomUUID(),
      ...draft,
      exercise: draft.exercise.trim(),
      userAdded: previous?.userAdded ?? true
    };
    if (index >= 0) day.exercises[index] = exercise; else day.exercises.push(exercise);
    showExerciseForm = false;
    scheduleWorkspaceAutosave(0);
  }
  function removeExercise(exercise: ExerciseRow) {
    if (!day || !confirm(`¿Eliminar ${exercise.exercise}?`)) return;
    day.exercises = day.exercises.filter(item => item !== exercise);
    scheduleWorkspaceAutosave(0);
  }
  function resetTraining() {
    if (!confirm('¿Quieres borrar los registros de esta semana?')) return;
    if (!confirm('Esta acción no se puede deshacer. ¿Confirmas el reinicio del entrenamiento?')) return;
    appState.weekTracker.trainingWeights = {};
    appState.weekTracker.trainingRepetitions = {};
    appState.weekTracker.exerciseNotes = {};
    appState.weekTracker.cardioByDay = {};
    appState.weekTracker.stepsByDay = {};
    scheduleWorkspaceAutosave(0);
  }
  async function exportPdf() {
    if (!training) return;
    await flushWorkspaceAutosave();
    downloadTrainingPdf(training, appState.weekTracker, appState.activePlanName);
  }
  async function saveProgress() { await saveWorkspaceNow('Progreso guardado'); }
</script>

<section class="app-surface overflow-hidden rounded-3xl border" aria-labelledby="training-title">
  <header class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-4 dark:border-stone-700 sm:px-6">
    <div class="min-w-0">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-warm">Entrenamiento de hoy</p>
      <h2 id="training-title" class="mt-1 overflow-wrap-anywhere text-2xl font-black">
        Día {dayIndex + 1}{day ? ` · ${day.title}` : ''}
      </h2>
    </div>
    <div class="flex gap-2">
      <button
        class="app-accent-button min-h-11 rounded-xl px-4 text-sm font-black"
        onclick={() => void exportPdf()}
        disabled={!training}
      >Exportar PDF</button>
      <button
        class="min-h-11 rounded-xl border border-red-300 px-3 text-sm font-black text-red-600 dark:border-red-900 dark:text-red-300"
        onclick={resetTraining}
      >Reiniciar</button>
    </div>
  </header>

  {#if training && day}
    {#if training.tips.length || training.defaultRestSeconds !== null}
      <details class="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
        <summary class="min-h-11 cursor-pointer py-2 font-black">
          Indicaciones generales{training.defaultRestSeconds !== null ? ` · ${training.defaultRestSeconds}s descanso` : ''}
        </summary>
        <ul class="space-y-1 pb-2 text-sm text-stone-600 dark:text-stone-300">
          {#each training.tips as tip}<li>• {tip}</li>{/each}
        </ul>
      </details>
    {/if}
    {#if day.activeRest}
      <p class="p-5 font-bold text-stone-700 dark:text-stone-200">
        {day.details || 'Día de descanso. Puedes registrar cardio suave si lo realizas.'}
      </p>
    {/if}
    {#if day.exercises.length}
      <ol class="divide-y divide-stone-200 dark:divide-stone-700">
        {#each day.exercises as exercise, exerciseIndex (exercise.id)}
          <ExerciseCard {day} {exercise} index={exerciseIndex} bind:visibleIllustrations onEdit={editExercise} onRemove={removeExercise} />
        {/each}
      </ol>
    {/if}
    <div class="border-t border-stone-200 p-4 dark:border-stone-700">
      <button
        class="min-h-11 w-full rounded-xl border border-orange-400 px-4 font-black text-warm"
        onclick={openNewExercise}
      >Añadir ejercicio</button>
    </div>

    <CardioForm {dayIndex} />
    <div class="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 p-4">
      <button
        class="app-accent-button min-h-12 w-full rounded-2xl font-black disabled:opacity-60"
        disabled={appState.saveStatus === 'saving'}
        onclick={() => void saveProgress()}
      >
        {appState.saveStatus === 'saving'
          ? 'Guardando…'
          : appState.saveStatus === 'error' ? 'Error al guardar · Reintentar' : 'Guardar progreso'}
      </button>
    </div>
  {:else}
    <div class="p-6 text-center"><p class="font-black">Este plan no incluye una rutina de entrenamiento.</p></div>
  {/if}
</section>

{#if showExerciseForm}
  <ExerciseEditorModal
    editing={editingExistingExercise}
    bind:draft
    onSave={saveExercise}
    onClose={() => showExerciseForm = false}
  />
{/if}
