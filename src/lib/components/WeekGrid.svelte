<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { DaySelection } from '$lib/types';
  import { hasException, setDayDiet } from '$lib/utils';

  let { onDayClick, selectedDayIndex } = $props<{
    onDayClick: (dayIndex: number) => void;
    selectedDayIndex: number | null;
  }>();

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  function changeDiet(dayIndex: number, diet: DaySelection['diet']) {
    setDayDiet(appState.weekConfig, dayIndex, diet);
    appState.shoppingList = [];
    appState.checkedShoppingItems = {};
  }
</script>

<section class="compact-week rounded-3xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-6">
  <div class="compact-week-header mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Paso 1</p>
      <h2 class="mt-1 text-2xl font-black tracking-tight text-stone-900 dark:text-white">Organiza tu semana</h2>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Asigna una dieta a cada día y abre el día para elegir sus platos.</p>
    </div>
    <div class="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">7 días</div>
  </div>

  <div class="compact-week-grid grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
    {#each appState.weekConfig.days.slice(0, 7) as day, dayIndex}
      {@const isSelected = selectedDayIndex === dayIndex}
      {@const isException = hasException(appState.weekConfig, dayIndex)}
      <article class="compact-day-card rounded-2xl border p-3 transition {isSelected ? 'border-orange-500 bg-orange-50 shadow-md dark:bg-orange-950/30' : 'border-stone-200 bg-stone-50 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-800/60'}">
        <button class="compact-day-heading mb-3 flex w-full items-center justify-between text-left" onclick={() => onDayClick(dayIndex)}>
          <span>
            <span class="block text-xs font-bold uppercase tracking-wider text-stone-400">{dayNames[dayIndex]}</span>
            <span class="text-base font-black text-stone-900 dark:text-white">Día {day.day}</span>
          </span>
          <span class="grid size-7 place-items-center rounded-full {isSelected ? 'bg-orange-600 text-white' : 'bg-white text-stone-400 dark:bg-stone-700'}" aria-hidden="true">→</span>
        </button>

        <div class="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 dark:bg-stone-900">
          {#each ['DIETA 1', 'DIETA 2'] as diet}
            <button
              class="rounded-lg px-2 py-2 text-xs font-black transition {day.diet === diet ? (diet === 'DIETA 1' ? 'bg-amber-200 text-amber-950' : 'bg-teal-200 text-teal-950') : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}"
              onclick={() => changeDiet(dayIndex, diet as DaySelection['diet'])}
              aria-pressed={day.diet === diet}
            >
              {diet === 'DIETA 1' ? 'Dieta 1' : 'Dieta 2'}
            </button>
          {/each}
        </div>
        {#if isException}
          <p class="mt-2 text-center text-[11px] font-bold text-amber-700 dark:text-amber-400">Selección personalizada</p>
        {/if}
      </article>
    {/each}
  </div>
</section>
