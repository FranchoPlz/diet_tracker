<script lang="ts">
  import { appState } from '$lib/state.svelte';

  const training = $derived(appState.parsedData?.training);

  function dayLabel(days: number[]) {
    return days.length === 1 ? `Día ${days[0]}` : `Días ${days.join(' · ')}`;
  }
</script>

<section aria-labelledby="training-title" class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
  <header class="border-b border-stone-100 bg-stone-50/70 px-5 py-5 dark:border-stone-800 dark:bg-stone-900 sm:px-6">
    <h2 id="training-title" class="text-2xl font-black tracking-tight text-stone-950 dark:text-white">Entrenamiento</h2>
  </header>

  {#if training && training.days.length > 0}
    <div class="space-y-3 p-3 sm:p-5">
      {#if training.tips.length > 0 || training.defaultRestSeconds !== null}
        <details class="group rounded-2xl border border-orange-200 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/20">
          <summary class="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 [&::-webkit-details-marker]:hidden">
            <span class="text-sm font-black text-stone-900 dark:text-white">Indicaciones generales</span>
            <span aria-hidden="true" class="text-lg font-black text-orange-700 transition-transform group-open:rotate-180 dark:text-orange-300">⌄</span>
          </summary>
          <div aria-label="Indicaciones generales" class="grid gap-4 border-t border-orange-200 p-4 dark:border-orange-900 sm:grid-cols-[auto_1fr] sm:p-5">
          {#if training.defaultRestSeconds !== null}
            <div class="flex items-center gap-3 sm:block sm:border-r sm:border-orange-200 sm:pr-5 dark:sm:border-orange-900">
              <span class="text-2xl font-black text-orange-700 dark:text-orange-300">{training.defaultRestSeconds}s</span>
              <span class="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Descanso entre series</span>
            </div>
          {/if}
          {#if training.tips.length > 0}
            <div>
              <h3 class="text-sm font-black text-stone-900 dark:text-white">Consejos para la rutina</h3>
              <ul class="mt-2 space-y-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {#each training.tips as tip}
                  <li class="flex gap-2"><span aria-hidden="true" class="font-black text-orange-600">·</span><span>{tip}</span></li>
                {/each}
              </ul>
            </div>
          {/if}
          </div>
        </details>
      {/if}

      <div class="grid gap-3 lg:grid-cols-2">
        {#each training.days as day, dayIndex}
          <details class="group min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/60 dark:border-stone-700 dark:bg-stone-800/40">
            <summary aria-label={`${dayLabel(day.days)}: ${day.title}`} class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 bg-white px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 dark:bg-stone-800 sm:px-5 [&::-webkit-details-marker]:hidden">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">{dayLabel(day.days)}</p>
                <h3 class="mt-0.5 text-lg font-black text-stone-950 dark:text-white">{day.title}</h3>
              </div>
              <span aria-hidden="true" class="text-lg font-black text-stone-400 transition-transform group-open:rotate-180">⌄</span>
            </summary>

            {#if day.activeRest}
              <div class="border-t border-stone-200 p-4 dark:border-stone-700 sm:p-5">
                <p class="text-sm font-bold leading-relaxed text-stone-700 dark:text-stone-200">{day.details || 'Realiza una actividad suave para mantenerte en movimiento.'}</p>
              </div>
            {:else if day.exercises.length > 0}
              <ol aria-label={`Ejercicios de ${day.title}`} class="divide-y border-t border-stone-200 divide-stone-200 dark:border-stone-700 dark:divide-stone-700">
                {#each day.exercises as exercise, index}
                  <li class="p-4 sm:p-5">
                    <div class="flex min-w-0 gap-3">
                      <span aria-hidden="true" class="grid size-8 shrink-0 place-items-center rounded-xl bg-stone-900 text-xs font-black text-white dark:bg-white dark:text-stone-900">{index + 1}</span>
                      <div class="min-w-0 flex-1">
                        {#if appState.exercisePreviewUrls[`${dayIndex}:${index}`]}
                          <img
                            class="mb-3 max-h-56 w-full rounded-xl border border-stone-200 object-contain dark:border-stone-700"
                            loading="lazy"
                            src={appState.exercisePreviewUrls[`${dayIndex}:${index}`]}
                            alt={`Vista previa del ejercicio ${exercise.exercise} del ${dayLabel(day.days)}`}
                          />
                        {/if}
                        <div class="flex flex-wrap items-start justify-between gap-2">
                          <h4 class="min-w-0 font-black leading-snug text-stone-900 dark:text-white">{exercise.exercise}</h4>
                          {#if exercise.supersetExercises?.length}
                            <span class="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider text-orange-800 dark:bg-orange-950 dark:text-orange-200">Superserie</span>
                          {/if}
                        </div>
                        <dl class="mt-3 grid grid-cols-2 gap-2">
                          <div class="rounded-xl bg-white px-3 py-2 dark:bg-stone-900">
                            <dt class="text-[0.65rem] font-black uppercase tracking-wider text-stone-400">Series</dt>
                            <dd class="mt-0.5 whitespace-pre-line text-sm font-bold text-stone-800 dark:text-stone-100">{exercise.series || '—'}</dd>
                          </div>
                          <div class="rounded-xl bg-white px-3 py-2 dark:bg-stone-900">
                            <dt class="text-[0.65rem] font-black uppercase tracking-wider text-stone-400">Repeticiones</dt>
                            <dd class="mt-0.5 whitespace-pre-line text-sm font-bold text-stone-800 dark:text-stone-100">{exercise.repetitions || '—'}</dd>
                          </div>
                        </dl>
                        {#if exercise.supersetExercises?.length}
                          <p class="mt-3 text-xs font-bold leading-relaxed text-orange-700 dark:text-orange-300">Combina: {exercise.supersetExercises.join(' + ')}</p>
                        {/if}
                        {#if exercise.details}
                          <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600 dark:text-stone-300">{exercise.details}</p>
                        {/if}
                      </div>
                    </div>
                  </li>
                {/each}
              </ol>
            {:else}
              <p class="p-4 text-sm text-stone-500 dark:text-stone-400 sm:p-5">No hay ejercicios indicados para este día.</p>
            {/if}
          </details>
        {/each}
      </div>
    </div>
  {:else}
    <div class="px-5 py-10 text-center sm:px-8 sm:py-14">
      <p class="text-lg font-black text-stone-900 dark:text-white">Este plan no incluye una rutina de entrenamiento.</p>
      <p class="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-stone-500 dark:text-stone-400">Carga un PDF compatible o una versión más reciente que incluya el plan de entrenamiento.</p>
    </div>
  {/if}
</section>
