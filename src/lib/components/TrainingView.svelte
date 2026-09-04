<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { downloadTrainingPdf } from '$lib/training-export';
  import { exerciseWeightKey, seriesCount, setExerciseWeight } from '$lib/week-tracker';
  import { scheduleWorkspaceAutosave } from '$lib/workspace-controller';

  const training = $derived(appState.parsedData?.training);
  const dayIndex = $derived(appState.weekTracker.activeDayIndex);
  const trainingDayIndex = $derived(training?.days.findIndex((day) => day.days.includes(dayIndex + 1)) ?? -1);
  const day = $derived(trainingDayIndex >= 0 ? training?.days[trainingDayIndex] : undefined);

  function exportPdf() {
    if (training) downloadTrainingPdf(training, appState.weekTracker.trainingWeights, appState.activePlanName, appState.weekTracker.weekNumber);
  }

  function resetTraining() {
    if (!confirm('¿Quieres borrar todos los pesos registrados esta semana?')) return;
    if (!confirm('Esta acción no se puede deshacer. ¿Confirmas el reinicio del entrenamiento?')) return;
    appState.weekTracker.trainingWeights = {};
    scheduleWorkspaceAutosave(0);
  }
</script>

<section class="app-surface overflow-hidden rounded-3xl border" aria-labelledby="training-title">
  <header class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-4 dark:border-stone-700 sm:px-6">
    <div>
      <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Entrenamiento de hoy</p>
      <h2 id="training-title" class="mt-1 text-2xl font-black">Día {dayIndex + 1}{day ? ` · ${day.title}` : ''}</h2>
    </div>
    <div class="flex w-full gap-2 sm:w-auto">
      <button class="app-accent-button min-h-11 flex-1 rounded-xl px-3 text-sm font-black" onclick={exportPdf} disabled={!training}>Exportar PDF</button>
      <button class="min-h-11 flex-1 rounded-xl border border-red-300 px-3 text-sm font-black text-red-700 dark:border-red-900 dark:text-red-300" onclick={resetTraining}>Reiniciar</button>
    </div>
  </header>

  {#if training && day}
    {#if training.tips.length > 0 || training.defaultRestSeconds !== null}
      <details class="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
        <summary class="min-h-11 cursor-pointer py-2 font-black">Indicaciones generales{training.defaultRestSeconds !== null ? ` · ${training.defaultRestSeconds}s descanso` : ''}</summary>
        <ul class="space-y-1 pb-2 text-sm text-stone-600 dark:text-stone-300">{#each training.tips as tip}<li>• {tip}</li>{/each}</ul>
      </details>
    {/if}
    {#if day.activeRest}
      <p class="p-5 font-bold text-stone-700 dark:text-stone-200">{day.details || 'Realiza una actividad suave para mantenerte en movimiento.'}</p>
    {:else if day.exercises.length > 0}
      <ol class="divide-y divide-stone-200 dark:divide-stone-700">
        {#each day.exercises as exercise, exerciseIndex}
          {@const key = exerciseWeightKey(dayIndex, exerciseIndex)}
          <li class="p-4 sm:p-5">
            <div class="flex items-start gap-3">
              <span class="grid size-8 shrink-0 place-items-center rounded-xl bg-stone-900 text-xs font-black text-white dark:bg-white dark:text-stone-900">{exerciseIndex + 1}</span>
              <div class="min-w-0 flex-1">
                <h3 class="font-black leading-snug">{exercise.exercise}</h3>
                <p class="mt-1 text-sm font-bold text-stone-500">{exercise.series || '—'} series · {exercise.repetitions || '—'} repeticiones</p>
                {#if exercise.details}<p class="mt-2 text-sm text-stone-600 dark:text-stone-300">{exercise.details}</p>{/if}
                <fieldset class="mt-4">
                  <legend class="mb-2 text-xs font-black uppercase tracking-wider text-stone-500">Peso por serie (kg)</legend>
                  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {#each Array(seriesCount(exercise.series)) as _, seriesIndex}
                      <label class="rounded-xl bg-stone-100 p-2 dark:bg-stone-800">
                        <span class="block text-[0.65rem] font-black uppercase text-stone-500">Serie {seriesIndex + 1}</span>
                        <input
                          type="number"
                          inputmode="decimal"
                          min="0"
                          step="0.5"
                          class="mt-1 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base font-black dark:border-stone-600 dark:bg-stone-900"
                          aria-label={`${exercise.exercise}, peso serie ${seriesIndex + 1}`}
                          value={appState.weekTracker.trainingWeights[key]?.[seriesIndex] ?? ''}
                          oninput={(event) => setExerciseWeight(dayIndex, exerciseIndex, seriesIndex, event.currentTarget.value)}
                        />
                      </label>
                    {/each}
                  </div>
                </fieldset>
              </div>
            </div>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="p-5 text-sm text-stone-500">No hay ejercicios indicados para este día.</p>
    {/if}
  {:else if training}
    <p class="p-5 text-sm text-stone-500">No hay entrenamiento asignado al día {dayIndex + 1}.</p>
  {:else}
    <div class="px-5 py-10 text-center"><p class="text-lg font-black">Este plan no incluye una rutina de entrenamiento.</p></div>
  {/if}
</section>
