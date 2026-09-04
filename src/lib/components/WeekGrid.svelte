<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection } from '$lib/types';
  import { hasException, setDayDiet } from '$lib/utils';

  let { onDayClick, onCollapse, selectedDayIndex } = $props<{
    onDayClick: (dayIndex: number) => void;
    onCollapse?: () => void;
    selectedDayIndex: number | null;
  }>();

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  function changeDiet(dayIndex: number, diet: DaySelection['diet']) {
    setDayDiet(appState.weekConfig, dayIndex, diet);
    appState.shoppingList = [];
    appState.checkedShoppingItems = {};
  }

</script>

<details class="compact-week group min-w-0 max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900" open ontoggle={(event) => { if (!event.currentTarget.open) onCollapse?.(); }}>
  <summary class="compact-week-header flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
    <div>
      <h2 class="text-lg font-black tracking-tight text-stone-900 dark:text-white">Organiza tu semana</h2>
      <p class="text-xs text-stone-500 dark:text-stone-400">Asigna una dieta y pulsa el día para personalizarlo.</p>
    </div>
    <span class="text-xs font-black uppercase tracking-wider text-stone-400 group-open:hidden">Mostrar</span>
    <span class="hidden text-xs font-black uppercase tracking-wider text-stone-400 group-open:inline">Ocultar</span>
  </summary>

  <div class="divide-y divide-stone-200 border-t border-stone-200 dark:divide-stone-700 dark:border-stone-700">
    {#each appState.weekConfig.days.slice(0, 7) as day, dayIndex}
      {@const isSelected = selectedDayIndex === dayIndex}
      {@const isException = hasException(appState.weekConfig, dayIndex)}
      <article class="grid min-w-0 grid-cols-[minmax(5.5rem,1fr)_minmax(10rem,1.5fr)] items-center gap-2 px-3 py-2 transition {isSelected ? 'bg-orange-50 dark:bg-orange-950/30' : 'bg-white dark:bg-stone-900'}">
        <button class="min-w-0 rounded-lg px-2 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800" onclick={() => onDayClick(dayIndex)}>
          <span class="block truncate text-sm font-black text-stone-900 dark:text-white">{dayNames[dayIndex]}</span>
          {#if isException}<span class="block text-[10px] font-black uppercase text-orange-600">Personalizado</span>{/if}
        </button>

        <div class="grid grid-cols-2 gap-1 rounded-lg border border-stone-200 bg-stone-100 p-1 dark:border-stone-600 dark:bg-stone-950">
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
</details>
