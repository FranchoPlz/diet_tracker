<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import MealSelector from './MealSelector.svelte';

  let { 
    dayIndex, 
    onClose 
  } = $props<{ 
    dayIndex: number;
    onClose: () => void;
  }>();

  let day = $derived(appState.weekConfig.days[dayIndex]);
  let dietData = $derived(appState.parsedData?.diets.find(d => d.name === day.diet));
</script>

<div class="flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-4 max-h-[calc(100vh-2rem)]">
  <div class="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
    <div class="flex flex-col">
      <h2 class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Día {day.day} — {day.diet}</h2>
    </div>
    
    <button 
      class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
      onclick={onClose}
      aria-label="Cerrar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="p-5 overflow-y-auto">
    {#if dietData}
      <MealSelector {dayIndex} {dietData} />
    {:else}
      <div class="text-red-500 font-bold p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        Error: No se encontraron datos para {day.diet}
      </div>
    {/if}
  </div>
</div>