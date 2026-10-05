<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { cloneTrainingDay, createTrainingDay, inferDayType, normalizeTrainingPlan } from '$lib/training-model';
  import type { TrainingDayType } from '$lib/types';
  import { scheduleWorkspaceAutosave } from '$lib/workspace-controller';

  const names = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const choices: { value: TrainingDayType; label: string }[] = [
    { value: 'leg', label: 'Pierna' }, { value: 'upper', label: 'Torso' },
    { value: 'cardio', label: 'Cardio' }, { value: 'rest', label: 'Descanso' },
    { value: 'custom', label: 'Personalizado' },
  ];

  function training() {
    return appState.parsedData?.training;
  }

  function assign(index: number, type: TrainingDayType) {
    const plan = training();
    if (!plan) return;
    const template = plan.templateDays?.find(day => (day.type ?? inferDayType(day)) === type);
    plan.days[index] = template ? cloneTrainingDay(template, index + 1) : createTrainingDay(type, index + 1);
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
    scheduleWorkspaceAutosave();
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
  <details class="app-surface overflow-hidden rounded-3xl border">
    <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 py-3 font-black [&::-webkit-details-marker]:hidden">
      <span>Organizar semana</span><span class="text-sm text-orange-600">Editar</span>
    </summary>
    <div class="space-y-2 border-t border-stone-200 p-3 dark:border-stone-700">
      {#each appState.parsedData.training.days as day, index}
        <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl bg-stone-100 p-3 dark:bg-stone-800">
          <label class="min-w-0 text-xs font-black uppercase tracking-wide text-stone-500">
            {names[index]}
            <select class="mt-1 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-white" value={day.type ?? inferDayType(day)} onchange={(event) => assign(index, event.currentTarget.value as TrainingDayType)}>
              {#each choices as choice}<option value={choice.value}>{choice.label}</option>{/each}
            </select>
          </label>
          <div class="flex items-end gap-1">
            <button class="min-h-11 min-w-11 rounded-xl border border-stone-300 font-black disabled:opacity-30 dark:border-stone-600" disabled={index === 0} onclick={() => swap(index, -1)} aria-label={`Mover ${names[index]} arriba`}>↑</button>
            <button class="min-h-11 min-w-11 rounded-xl border border-stone-300 font-black disabled:opacity-30 dark:border-stone-600" disabled={index === 6} onclick={() => swap(index, 1)} aria-label={`Mover ${names[index]} abajo`}>↓</button>
            <button class="min-h-11 rounded-xl border border-stone-300 px-3 text-xs font-black dark:border-stone-600" onclick={() => duplicate(index)}>Duplicar</button>
          </div>
        </div>
      {/each}
      <button class="min-h-11 w-full rounded-xl border border-red-300 px-4 text-sm font-black text-red-600 dark:border-red-900 dark:text-red-300" onclick={restore}>Restaurar plantilla original</button>
    </div>
  </details>
{/if}
