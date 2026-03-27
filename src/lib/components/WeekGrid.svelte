<script lang="ts">
  import { appState } from '$lib/state.svelte';
  
  let { 
    onDayClick, 
    selectedDayIndex
  } = $props<{ 
    onDayClick: (dayIndex: number) => void;
    selectedDayIndex: number | null;
  }>();

  function setWeeks(w: number) {
    if (w >= 1 && w <= 4) {
      appState.weekConfig.weeks = w;
    }
  }

  function handleDayClick(dayIndex: number) {
    onDayClick(dayIndex);
  }
</script>

<div class="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4">
  <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <h2 class="text-xl font-black text-gray-800 dark:text-white tracking-tight">Planificador</h2>
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Semanas:</span>
      <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {#each [1, 2, 3, 4] as w}
          <button 
            class="w-10 h-8 rounded-md text-sm font-bold {appState.weekConfig.weeks === w ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
            onclick={() => setWeeks(w)}
          >
            {w}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex flex-col gap-8">
    {#each Array.from({ length: appState.weekConfig.weeks }) as _, weekIndex}
      <div class="flex flex-col gap-3">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
          Semana {weekIndex + 1}
        </h3>
        
        <div class="grid grid-cols-7 gap-2 md:gap-4">
          {#each Array.from({ length: 7 }) as _, dayOfWeek}
            {@const dayIndex = weekIndex * 7 + dayOfWeek}
            {@const day = appState.weekConfig.days[dayIndex]}
            {@const isD1 = day.diet === 'DIETA 1'}
            {@const isSelected = selectedDayIndex === dayIndex}
            
            <button 
              class="relative flex flex-col items-center justify-center p-3 h-24 rounded-xl border text-left
                {isD1 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30' : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'}
                {isSelected ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:shadow-sm hover:scale-[1.01]'}"
              onclick={() => handleDayClick(dayIndex)}
            >
              <span class="text-sm font-bold text-gray-500 dark:text-gray-400">Día {day.day}</span>
              <span class="mt-1 text-xs font-black px-2 py-1 rounded-md 
                {isD1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'}"
              >
                {isD1 ? 'D1' : 'D2'}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>