<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { findExerciseIllustration } from '$lib/exercise-illustrations';
  import { downloadTrainingPdf } from '$lib/training-export';
  import { inferExerciseType, memberTargets, progressKey } from '$lib/training-model';
  import type { CardioEntry, ExerciseRow, ExerciseType } from '$lib/types';
  import { dayRecordKey, repetitionTargets, seriesCount, setCardio, setExerciseNotes, setProgressValue, setSteps } from '$lib/week-tracker';
  import { flushWorkspaceAutosave, saveWorkspaceNow, scheduleWorkspaceAutosave } from '$lib/workspace-controller';
  import ExerciseEditorModal from './ExerciseEditorModal.svelte';

  const training = $derived(appState.parsedData?.training);
  const dayIndex = $derived(appState.weekTracker.activeDayIndex);
  const day = $derived(training?.days[dayIndex]);
  const cardioKey = $derived(dayRecordKey(dayIndex));
  const cardio = $derived(appState.weekTracker.cardioByDay?.[cardioKey] ?? { activity: '', duration: '', distance: '', intensity: '', calories: '', notes: '' });
  let visibleIllustrations = $state<Record<string, boolean>>({});
  let showExerciseForm = $state(false);
  let editingExerciseId = $state<string | null>(null);
  let editingExistingExercise = $state(false);
  let editingExerciseIndex = $state<number | null>(null);
  let editingDayId = $state<string | null>(null);
  let draft = $state({ exercise: '', type: 'strength' as ExerciseType, series: '3', repetitions: '', duration: '', details: '', notes: '' });

  function values(key: string, field: 'weight' | 'repetitions') {
    const store = field === 'weight' ? appState.weekTracker.trainingWeights : appState.weekTracker.trainingRepetitions;
    return store?.[key] ?? [];
  }
  function updateCardio(field: keyof CardioEntry, value: string) { setCardio(dayIndex, { ...cardio, [field]: value }); }
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
    draft = { exercise: exercise.exercise, type: inferExerciseType(exercise), series: exercise.series, repetitions: exercise.repetitions, duration: exercise.duration ?? '', details: exercise.details, notes: exercise.notes ?? '' };
    showExerciseForm = true;
  }
  function saveExercise() {
    if (!day || editingDayId !== (day.id ?? null) || !draft.exercise.trim()) return;
    const index = editingExerciseId
      ? day.exercises.findIndex(item => item.id === editingExerciseId)
      : (editingExerciseIndex ?? -1);
    const previous = index >= 0 ? day.exercises[index] : undefined;
    const exercise: ExerciseRow = { ...previous, id: editingExerciseId ?? crypto.randomUUID(), ...draft, exercise: draft.exercise.trim(), userAdded: previous?.userAdded ?? true };
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
    <div class="min-w-0"><p class="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Entrenamiento de hoy</p><h2 id="training-title" class="mt-1 overflow-wrap-anywhere text-2xl font-black">Día {dayIndex + 1}{day ? ` · ${day.title}` : ''}</h2></div>
    <div class="flex gap-2"><button class="app-accent-button min-h-11 rounded-xl px-4 text-sm font-black" onclick={() => void exportPdf()} disabled={!training}>Exportar PDF</button><button class="min-h-11 rounded-xl border border-red-300 px-3 text-sm font-black text-red-600 dark:border-red-900 dark:text-red-300" onclick={resetTraining}>Reiniciar</button></div>
  </header>

  {#if training && day}
    {#if training.tips.length || training.defaultRestSeconds !== null}<details class="border-b border-stone-200 px-4 py-3 dark:border-stone-700"><summary class="min-h-11 cursor-pointer py-2 font-black">Indicaciones generales{training.defaultRestSeconds !== null ? ` · ${training.defaultRestSeconds}s descanso` : ''}</summary><ul class="space-y-1 pb-2 text-sm text-stone-600 dark:text-stone-300">{#each training.tips as tip}<li>• {tip}</li>{/each}</ul></details>{/if}
    {#if day.activeRest}<p class="p-5 font-bold text-stone-700 dark:text-stone-200">{day.details || 'Día de descanso. Puedes registrar cardio suave si lo realizas.'}</p>{/if}
    {#if day.exercises.length}
      <ol class="divide-y divide-stone-200 dark:divide-stone-700">
        {#each day.exercises as exercise, exerciseIndex (exercise.id)}
          {@const names = exercise.supersetExercises?.length ? exercise.supersetExercises : [exercise.exercise]}
          {@const exerciseType = inferExerciseType(exercise)}
          <li><details open class="group"><summary class="flex cursor-pointer list-none items-start gap-3 p-4 sm:p-6 [&::-webkit-details-marker]:hidden"><span class="grid size-8 shrink-0 place-items-center rounded-xl bg-stone-900 text-xs font-black text-white dark:bg-white dark:text-stone-900">{exerciseIndex + 1}</span><div class="min-w-0 flex-1"><h3 class="break-words text-lg font-black leading-snug">{exercise.exercise}</h3>{#if names.length > 1}<p class="mt-1 text-xs font-black uppercase tracking-wide text-orange-600">Superserie · registros independientes</p>{/if}{#if exercise.details}<p class="mt-1 break-words text-sm text-stone-600 dark:text-stone-300">{exercise.details}</p>{/if}</div><span class="flex shrink-0 gap-1"><button type="button" class="grid min-h-11 min-w-11 place-items-center rounded-xl text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-950/30" onclick={(event) => { event.preventDefault(); event.stopPropagation(); editExercise(exercise); }} aria-label={`Editar ${exercise.exercise}`}><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button><button type="button" class="grid min-h-11 min-w-11 place-items-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" onclick={(event) => { event.preventDefault(); event.stopPropagation(); removeExercise(exercise); }} aria-label={`Eliminar ${exercise.exercise}`}><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg></button></span><span aria-hidden="true" class="pt-2">⌄</span></summary><div class="px-4 pb-4 sm:px-6 sm:pb-6">
            {#each names as name, memberIndex}
              {@const key = progressKey(day, exercise, names.length > 1 ? memberIndex : undefined)}
              {@const count = seriesCount(exercise.series)}
              {@const targets = names.length > 1 ? memberTargets(exercise.repetitions, count, memberIndex, names.length) : repetitionTargets(exercise.repetitions, count)}
              <div class="mt-4 overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700">
                <div class="flex items-center justify-between gap-2 bg-stone-100 px-3 py-2 dark:bg-stone-800"><strong class="break-words">{name}</strong>{#if !appState.alwaysShowExerciseIllustrations}<button class="min-h-11 rounded-xl px-3 text-xs font-black text-orange-600" aria-label={`${visibleIllustrations[key] ? 'Ocultar' : 'Mostrar'} guía de ${name}`} aria-expanded={visibleIllustrations[key] ?? false} onclick={() => visibleIllustrations[key] = !visibleIllustrations[key]}>{visibleIllustrations[key] ? 'Ocultar guía' : 'Ver guía'}</button>{/if}</div>
                {#if visibleIllustrations[key] || appState.alwaysShowExerciseIllustrations}<div class="p-3">{#if findExerciseIllustration(name)}<div class="grid grid-cols-3 gap-2">{#each findExerciseIllustration(name)?.frameUrls ?? [] as url, i}<img class="aspect-square w-full rounded-xl bg-white object-contain" src={url} alt={`${name}, posición ${i + 1}`} />{/each}</div>{:else}<p class="py-3 text-center text-sm font-bold text-stone-500">No hay una guía visual disponible para {name}.</p>{/if}</div>{/if}
                {#if exerciseType === 'cardio'}
                  <div class="grid gap-3 p-3 sm:grid-cols-2"><label class="text-sm font-bold">Duración objetivo<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={exercise.duration || exercise.repetitions} readonly /></label><label class="text-sm font-bold">Notas<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={appState.weekTracker.exerciseNotes?.[key] ?? ''} oninput={(e) => setExerciseNotes(key, e.currentTarget.value)} onblur={() => void flushWorkspaceAutosave()} /></label></div>
                {:else}
                  <div class="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] gap-2 bg-stone-100 px-3 py-2 text-xs font-black uppercase text-stone-500 dark:bg-stone-800"><span>Serie</span><span>Peso</span><span>Reps hechas</span></div>
                  {#each Array(count) as _, seriesIndex}<div class="grid grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 border-t border-stone-200 px-3 py-2 dark:border-stone-700"><div><strong>{seriesIndex + 1}</strong><small class="block text-stone-500">{targets[seriesIndex]} obj.</small></div><label><span class="sr-only">{name}, peso serie {seriesIndex + 1}</span><input type="number" inputmode="decimal" min="0" step="0.5" class="min-h-11 w-full rounded-xl border bg-transparent px-3" value={values(key, 'weight')[seriesIndex] ?? ''} oninput={(e) => setProgressValue(key, 'weight', seriesIndex, e.currentTarget.value)} onblur={() => void flushWorkspaceAutosave()} /></label><label><span class="sr-only">{name}, repeticiones serie {seriesIndex + 1}</span><input type="number" inputmode="numeric" min="0" step="1" class="min-h-11 w-full rounded-xl border bg-transparent px-3" value={values(key, 'repetitions')[seriesIndex] ?? ''} placeholder={targets[seriesIndex]} oninput={(e) => setProgressValue(key, 'repetitions', seriesIndex, e.currentTarget.value)} onblur={() => void flushWorkspaceAutosave()} /></label></div>{/each}
                  <label class="block border-t border-stone-200 p-3 text-sm font-bold dark:border-stone-700">Notas<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={appState.weekTracker.exerciseNotes?.[key] ?? exercise.notes ?? ''} oninput={(e) => setExerciseNotes(key, e.currentTarget.value)} onblur={() => void flushWorkspaceAutosave()} /></label>
                {/if}
              </div>
            {/each}
          </div></details></li>
        {/each}
      </ol>
    {/if}
    <div class="border-t border-stone-200 p-4 dark:border-stone-700"><button class="min-h-11 w-full rounded-xl border border-orange-400 px-4 font-black text-orange-600" onclick={openNewExercise}>Añadir ejercicio</button></div>

    <section class="border-t border-stone-200 p-4 dark:border-stone-700"><h3 class="text-lg font-black">Registrar cardio</h3><p class="text-sm text-stone-500">Disponible todos los días como sesión principal o complemento.</p><div class="mt-3 grid gap-3 sm:grid-cols-2"><label class="text-sm font-bold">Actividad<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" placeholder="Cinta, bici, caminar…" value={cardio.activity} oninput={(e) => updateCardio('activity', e.currentTarget.value)} /></label><label class="text-sm font-bold">Duración (min)<input type="number" inputmode="numeric" min="0" class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={cardio.duration} oninput={(e) => updateCardio('duration', e.currentTarget.value)} /></label><label class="text-sm font-bold">Distancia opcional<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" placeholder="Ej. 5 km" value={cardio.distance} oninput={(e) => updateCardio('distance', e.currentTarget.value)} /></label><label class="text-sm font-bold">Intensidad / ritmo / inclinación<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={cardio.intensity} oninput={(e) => updateCardio('intensity', e.currentTarget.value)} /></label><label class="text-sm font-bold">Calorías opcionales<input type="number" inputmode="numeric" min="0" class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={cardio.calories} oninput={(e) => updateCardio('calories', e.currentTarget.value)} /></label><label class="text-sm font-bold">Notas<input class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3" value={cardio.notes} oninput={(e) => updateCardio('notes', e.currentTarget.value)} /></label></div></section>
    <section class="border-t border-stone-200 p-4 dark:border-stone-700"><label class="block text-lg font-black">Pasos del día<input type="number" inputmode="numeric" min="0" step="1" class="mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4" value={appState.weekTracker.stepsByDay?.[cardioKey] ?? ''} oninput={(e) => setSteps(dayIndex, e.currentTarget.value)} onblur={() => void flushWorkspaceAutosave()} /></label></section>
    <div class="sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 p-4"><button class="app-accent-button min-h-12 w-full rounded-2xl font-black disabled:opacity-60" disabled={appState.saveStatus === 'saving'} onclick={() => void saveProgress()}>{appState.saveStatus === 'saving' ? 'Guardando…' : appState.saveStatus === 'error' ? 'Error al guardar · Reintentar' : 'Guardar progreso'}</button></div>
  {:else}<div class="p-6 text-center"><p class="font-black">Este plan no incluye una rutina de entrenamiento.</p></div>{/if}
</section>

{#if showExerciseForm}
  <ExerciseEditorModal editing={editingExistingExercise} bind:draft onSave={saveExercise} onClose={() => showExerciseForm = false} />
{/if}
