<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { cloneTrainingDay, createTrainingDay, inferDayType, normalizeTrainingPlan } from '$lib/training-model';
  import type { TrainingDayType } from '$lib/types';
  import { scheduleWorkspaceAutosave } from '$lib/workspace-controller';

  const names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const customChoices: { value: TrainingDayType; label: string }[] = [
    { value: 'cardio', label: 'Nuevo día de cardio' },
    { value: 'rest', label: 'Nuevo día de descanso' },
    { value: 'custom', label: 'Nuevo entrenamiento personalizado' },
  ];
  const templateOptions = $derived.by(() => {
    const templates = appState.parsedData?.training?.templateDays ?? [];
    const seen = new Set<string>();
    return templates.flatMap((day, index) => {
      const key = day.title.trim().toLocaleLowerCase('es');
      if (!key || seen.has(key)) return [];
      seen.add(key);
      return [{ index, title: day.title.trim() }];
    });
  });

  function training() {
    return appState.parsedData?.training;
  }

  function selectedValue(dayTitle: string, type: TrainingDayType | undefined): string {
    const template = templateOptions.find(option => option.title.toLocaleLowerCase('es') === dayTitle.trim().toLocaleLowerCase('es'));
    return template ? `template:${template.index}` : `new:${type ?? 'custom'}`;
  }

  function assign(index: number, value: string) {
    const plan = training();
    if (!plan) return;
    if (value.startsWith('template:')) {
      const template = plan.templateDays?.[Number(value.slice('template:'.length))];
      if (!template) return;
      plan.days[index] = cloneTrainingDay(template, index + 1);
    } else {
      plan.days[index] = createTrainingDay(value.slice('new:'.length) as TrainingDayType, index + 1);
    }
    scheduleWorkspaceAutosave();
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
    if (!plan) return;
    const target = Math.min(6, index + 1);
    if (target === index) return;
    if (!confirm(`¿Duplicar ${names[index]} sobre ${names[target]}? Se sustituirá su entrenamiento actual.`)) return;
    plan.days[target] = cloneTrainingDay(plan.days[index], target + 1);
    scheduleWorkspaceAutosave();
  }

  function restore() {
    const plan = training();
    if (!plan?.templateDays || !confirm('¿Restaurar la planificación original? Se conservarán los registros de progreso.')) return;
    const templateDays = JSON.parse(JSON.stringify(plan.templateDays));
    plan.days = normalizeTrainingPlan({ ...plan, days: templateDays, templateDays }).days;
    scheduleWorkspaceAutosave(0);
  }
</script>

{#if appState.parsedData?.training}
  <details class="compact-week group min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
    <summary class="compact-week-header flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
      <div>
        <h2 class="text-lg font-black tracking-tight text-stone-900 dark:text-white">Organiza tus entrenamientos</h2>
        <p class="text-xs text-stone-500 dark:text-stone-400">Asigna las rutinas del PDF y muévelas entre los días de la semana.</p>
      </div>
      <span class="text-xs font-black uppercase tracking-wider text-stone-400 group-open:hidden">Mostrar</span>
      <span class="hidden text-xs font-black uppercase tracking-wider text-stone-400 group-open:inline">Ocultar</span>
    </summary>
    <div class="divide-y divide-stone-200 border-t border-stone-200 dark:divide-stone-700 dark:border-stone-700">
      {#each appState.parsedData.training.days as day, index}
        <article class="grid min-w-0 gap-2 bg-white px-3 py-3 transition dark:bg-stone-900 sm:grid-cols-[minmax(7rem,0.7fr)_minmax(12rem,1.5fr)_auto] sm:items-center">
          <div class="min-w-0 px-2">
            <span class="block text-sm font-black text-stone-900 dark:text-white">{names[index]}</span>
            <span class="block truncate text-[11px] font-black uppercase tracking-wide text-orange-600">{day.title}</span>
          </div>
          <label class="min-w-0">
            <span class="sr-only">Entrenamiento de {names[index]}</span>
            <select class="min-h-11 w-full rounded-xl border border-stone-200 bg-stone-100 px-3 text-sm font-black text-stone-900 outline-none focus:border-orange-500 dark:border-stone-600 dark:bg-stone-950 dark:text-white" aria-label={`Entrenamiento de ${names[index]}`} value={selectedValue(day.title, day.type ?? inferDayType(day))} onchange={(event) => assign(index, event.currentTarget.value)}>
              <optgroup label="Rutinas del PDF">
                {#each templateOptions as option}<option value={`template:${option.index}`}>{option.title}</option>{/each}
              </optgroup>
              <optgroup label="Crear día">
                {#each customChoices as choice}<option value={`new:${choice.value}`}>{choice.label}</option>{/each}
              </optgroup>
            </select>
          </label>
          <div class="grid grid-cols-[2.75rem_2.75rem_minmax(5rem,auto)] gap-1 sm:flex">
            <button class="grid min-h-11 min-w-11 place-items-center rounded-xl border border-stone-200 bg-white font-black text-stone-600 disabled:opacity-25 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200" disabled={index === 0} onclick={() => swap(index, -1)} aria-label={`Mover entrenamiento de ${names[index]} al día anterior`}>↑</button>
            <button class="grid min-h-11 min-w-11 place-items-center rounded-xl border border-stone-200 bg-white font-black text-stone-600 disabled:opacity-25 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200" disabled={index === 6} onclick={() => swap(index, 1)} aria-label={`Mover entrenamiento de ${names[index]} al día siguiente`}>↓</button>
            <button class="min-h-11 rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-black text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300" onclick={() => duplicate(index)} aria-label={`Duplicar entrenamiento de ${names[index]}`}>Duplicar</button>
          </div>
        </article>
      {/each}
      <div class="bg-stone-50 p-3 dark:bg-stone-950/50">
        <button class="min-h-11 w-full rounded-xl border border-red-300 px-4 text-sm font-black text-red-600 dark:border-red-900 dark:text-red-300" onclick={restore}>Restaurar distribución original</button>
      </div>
    </div>
  </details>
{/if}
