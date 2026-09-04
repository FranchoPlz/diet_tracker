<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection } from '$lib/types';
  import { hasException, setDayDiet } from '$lib/utils';

  let { onDayClick, onCollapse, selectedDayIndex } = $props<{
    onDayClick: (dayIndex: number) => void;
    onCollapse?: () => void;
    selectedDayIndex: number | null;
  }>();

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  let expanded = $state(true);

  function changeDiet(dayIndex: number, diet: DaySelection['diet']) {
    setDayDiet(appState.weekConfig, dayIndex, diet);
    appState.shoppingList = [];
    appState.checkedShoppingItems = {};
  }

  function toggleExpanded() {
    expanded = !expanded;
    if (!expanded) onCollapse?.();
  }
</script>

<section class="compact-week min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
  <div class="compact-week-header flex items-center justify-between gap-3 px-4 py-3">
    <div>
      <h2 class="text-lg font-black tracking-tight text-stone-900 dark:text-white">Organiza tu semana</h2>
      <p class="text-xs text-stone-500 dark:text-stone-400">Asigna una dieta y pulsa el día para personalizarlo.</p>
    </div>
    <button class="min-h-10 rounded-xl border border-stone-200 px-3 text-xs font-black text-stone-600 dark:border-stone-700 dark:text-stone-200" onclick={toggleExpanded} aria-expanded={expanded}>{expanded ? 'Ocultar días' : 'Mostrar días'}</button>
  </div>

  {#if expanded}
  <div class="compact-week-grid grid grid-cols-2 gap-2 border-t border-stone-200 p-2 dark:border-stone-700 sm:grid-cols-4 xl:grid-cols-7">
    {#each appState.weekConfig.days.slice(0, 7) as day, dayIndex}
      {@const isSelected = selectedDayIndex === dayIndex}
      {@const isException = hasException(appState.weekConfig, dayIndex)}
      <article class="compact-day-card min-w-0 overflow-hidden rounded-xl border p-2 transition {isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/60'}">
        <button class="compact-day-heading mb-1.5 w-full rounded-lg px-1 py-1 text-left hover:bg-white/70 dark:hover:bg-stone-700" onclick={() => onDayClick(dayIndex)}>
          <span class="text-sm font-black text-stone-900 dark:text-white">{dayNames[dayIndex]}</span>
          {#if isException}<span class="ml-1 text-[10px] font-black uppercase text-orange-600">Personalizado</span>{/if}
        </button>

        <div class="grid grid-cols-2 gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 dark:border-stone-600 dark:bg-stone-950">
          {#each ['DIETA 1', 'DIETA 2'] as diet}
            <button
              class="rounded-lg px-1 py-1.5 text-[11px] font-black transition {day.diet === diet ? (diet === 'DIETA 1' ? 'bg-orange-600 text-white shadow-sm' : 'bg-red-700 text-white shadow-sm') : 'bg-white text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700'}"
              onclick={() => changeDiet(dayIndex, diet as DaySelection['diet'])}
              aria-pressed={day.diet === diet}
            >
              {diet === 'DIETA 1' ? 'Dieta 1' : 'Dieta 2'}
            </button>
          {/each}
        </div>
      </article>
    {/each}
  </div>
  {/if}
</section>
