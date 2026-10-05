<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { cloneTrainingDay, createTrainingDay, normalizeTrainingPlan } from '$lib/training-model';
  import type { TrainingDayType } from '$lib/types';
  import { scheduleWorkspaceAutosave } from '$lib/workspace-controller';
  import WorkoutPickerModal from './WorkoutPickerModal.svelte';

  const names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let editingDayIndex = $state<number | null>(null);
  const templateOptions = $derived.by(() => {
    const templates = appState.parsedData?.training?.templateDays ?? [];
    const seen = new Set<string>();
    return templates.flatMap((day, index) => {
      const title = day.title.trim();
      const key = title.toLocaleLowerCase('es');
      if (!key || seen.has(key)) return [];
      seen.add(key);
      return [{ index, title, exerciseCount: day.exercises.length, activeRest: day.activeRest }];
    });
  });

  function training() { return appState.parsedData?.training; }

  function selectTemplate(templateIndex: number) {
    const plan = training();
    if (!plan || editingDayIndex === null) return;
    const template = plan.templateDays?.[templateIndex];
    if (!template) return;
    plan.days[editingDayIndex] = cloneTrainingDay(template, editingDayIndex + 1);
    editingDayIndex = null;
    scheduleWorkspaceAutosave(0);
  }

  function createDay(type: TrainingDayType) {
    const plan = training();
    if (!plan || editingDayIndex === null) return;
    plan.days[editingDayIndex] = createTrainingDay(type, editingDayIndex + 1);
    editingDayIndex = null;
    scheduleWorkspaceAutosave(0);
  }

  function swap(index: number, direction: -1 | 1) {
    const plan = training();
    const other = index + direction;
    if (!plan || other < 0 || other >= plan.days.length) return;
    const first = plan.days[index];
    const second = plan.days[other];
    first.days = [other + 1];
    second.days = [index + 1];
    [plan.days[index], plan.days[other]] = [second, first];
    scheduleWorkspaceAutosave(0);
  }

  function duplicate(index: number) {
    const plan = training();
    if (!plan || index >= 6) return;
    if (!confirm(`¿Duplicar ${names[index]} sobre ${names[index + 1]}? Se sustituirá su entrenamiento actual.`)) return;
    plan.days[index + 1] = cloneTrainingDay(plan.days[index], index + 2);
    scheduleWorkspaceAutosave(0);
  }

  function restore() {
    const plan = training();
    if (!plan?.templateDays || !confirm('¿Restaurar la distribución original? Se conservarán los registros de progreso.')) return;
    const templateDays = JSON.parse(JSON.stringify(plan.templateDays));
    plan.days = normalizeTrainingPlan({ ...plan, days: templateDays, templateDays }).days;
    scheduleWorkspaceAutosave(0);
  }
</script>

{#if appState.parsedData?.training}
  <details class="compact-week group min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
    <summary class="compact-week-header flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
      <div><h2 class="text-lg font-black tracking-tight text-stone-900 dark:text-white">Organiza tus entrenamientos</h2><p class="text-xs text-stone-500 dark:text-stone-400">Tu semana de un vistazo. Cambia o mueve cada rutina.</p></div>
      <span class="text-xs font-black uppercase tracking-wider text-stone-400 group-open:hidden">Mostrar</span><span class="hidden text-xs font-black uppercase tracking-wider text-stone-400 group-open:inline">Ocultar</span>
    </summary>
    <div class="border-t border-stone-200 bg-stone-100 p-2 dark:border-stone-700 dark:bg-stone-950 sm:p-3">
      <div class="space-y-2">
        {#each appState.parsedData.training.days as day, index}
          <article class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <div class="flex min-w-0 items-center gap-3 p-3">
              <div class="grid size-12 shrink-0 place-items-center rounded-2xl {day.activeRest ? 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-200' : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'}"><span class="text-[10px] font-black uppercase">Día</span><span class="-mt-1 text-lg font-black">{index + 1}</span></div>
              <div class="min-w-0 flex-1"><p class="text-xs font-black uppercase tracking-wider text-stone-400">{names[index]}</p><h3 class="truncate text-lg font-black text-stone-900 dark:text-white">{day.title}</h3><p class="text-xs text-stone-500">{day.activeRest ? 'Descanso' : `${day.exercises.length} ${day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}`}</p></div>
              <button type="button" class="min-h-11 shrink-0 rounded-xl bg-stone-900 px-4 text-sm font-black text-white dark:bg-white dark:text-stone-900" onclick={() => editingDayIndex = index}>Cambiar</button>
            </div>
            <div class="grid grid-cols-3 border-t border-stone-100 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/50">
              <button type="button" class="min-h-11 border-r border-stone-200 text-xs font-black text-stone-600 disabled:opacity-25 dark:border-stone-700 dark:text-stone-300" disabled={index === 0} onclick={() => swap(index, -1)} aria-label={`Mover entrenamiento de ${names[index]} al día anterior`}><span aria-hidden="true">↑</span> Anterior</button>
              <button type="button" class="min-h-11 border-r border-stone-200 text-xs font-black text-stone-600 disabled:opacity-25 dark:border-stone-700 dark:text-stone-300" disabled={index === 6} onclick={() => swap(index, 1)} aria-label={`Mover entrenamiento de ${names[index]} al día siguiente`}><span aria-hidden="true">↓</span> Siguiente</button>
              <button type="button" class="min-h-11 text-xs font-black text-orange-700 disabled:opacity-25 dark:text-orange-300" disabled={index === 6} onclick={() => duplicate(index)} aria-label={`Duplicar entrenamiento de ${names[index]}`}>Duplicar</button>
            </div>
          </article>
        {/each}
      </div>
      <button class="mt-3 min-h-11 w-full rounded-xl border border-red-300 bg-white px-4 text-sm font-black text-red-600 dark:border-red-900 dark:bg-stone-900 dark:text-red-300" onclick={restore}>Restaurar semana original</button>
    </div>
  </details>
{/if}

{#if editingDayIndex !== null && appState.parsedData?.training?.days[editingDayIndex]}
  <WorkoutPickerModal dayName={names[editingDayIndex]} currentTitle={appState.parsedData.training.days[editingDayIndex].title} templates={templateOptions} onSelectTemplate={selectTemplate} onCreate={createDay} onClose={() => editingDayIndex = null} />
{/if}
