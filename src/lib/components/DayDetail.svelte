<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { hasException, clearException } from '$lib/utils';
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
  let isException = $derived(hasException(appState.weekConfig, dayIndex));

  let exceptionMode = $state(false);

  function handleClearException() {
    clearException(appState.weekConfig, dayIndex);
    exceptionMode = false;
  }
</script>

<div class="compact-day-detail flex flex-col bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
  <div class="compact-day-detail-header flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/50">
    <div class="flex flex-col">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Paso 2</p>
      <h2 class="text-2xl font-black tracking-tight text-stone-900 dark:text-white">Día {day.day} · {day.diet}</h2>
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

  <div class="compact-day-controls flex items-center gap-3 px-5 py-3 border-b border-stone-100 dark:border-stone-700 bg-stone-50/30 dark:bg-stone-800/30">
    <label class="flex items-center gap-2 cursor-pointer">
      <input 
        type="checkbox" 
        class="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
        checked={exceptionMode}
        onchange={() => exceptionMode = !exceptionMode}
      />
      <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
        Excepción para este día
      </span>
    </label>
    
    {#if isException}
      <button 
        class="text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-auto"
        onclick={handleClearException}
      >
        Borrar excepciones
      </button>
    {/if}
  </div>

  {#if !exceptionMode && !isException}
    <div class="px-5 py-2 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs text-blue-600 dark:text-blue-400">
        Los cambios se aplican a todos los días de <strong>{day.diet}</strong>
      </p>
    </div>
  {/if}

  {#if exceptionMode || isException}
    <div class="px-5 py-2 bg-amber-50/50 dark:bg-amber-900/10 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs text-amber-600 dark:text-amber-400">
        Los cambios solo se aplican al <strong>Día {day.day}</strong>
      </p>
    </div>
  {/if}

  <div class="compact-day-body p-5 overflow-y-auto">
    {#if dietData}
      <MealSelector {dayIndex} {dietData} asException={exceptionMode || isException} />
    {:else}
      <div class="text-red-500 font-bold p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        Error: No se encontraron datos para {day.diet}
      </div>
    {/if}
  </div>
</div>
