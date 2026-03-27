<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import PdfUpload from '$lib/components/PdfUpload.svelte';
  import DietAccordion from '$lib/components/DietAccordion.svelte';
  import WeekGrid from '$lib/components/WeekGrid.svelte';
  import DayDetail from '$lib/components/DayDetail.svelte';
  import CalculateButton from '$lib/components/CalculateButton.svelte';
  import ShoppingList from '$lib/components/ShoppingList.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import ConfigButtons from '$lib/components/ConfigButtons.svelte';

  let selectedDayIndex = $state<number | null>(null);

  function handleDayClick(dayIndex: number) {
    selectedDayIndex = dayIndex;
  }

  function handleCloseDayDetail() {
    selectedDayIndex = null;
  }
</script>

<svelte:head>
  <title>Planificador de Dieta</title>
</svelte:head>

<main class="max-w-6xl mx-auto p-6 space-y-12">
  <h1 class="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">Planificador de Dieta</h1>

  <PdfUpload />

  {#if appState.parsedData}
    <DietAccordion />

    <div class="border-t border-gray-200 dark:border-gray-800 pt-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div class="lg:col-span-2">
          <WeekGrid onDayClick={handleDayClick} {selectedDayIndex} />
        </div>

        <div class="lg:col-span-1">
          {#if selectedDayIndex !== null}
            {#key selectedDayIndex}
              <DayDetail dayIndex={selectedDayIndex} onClose={handleCloseDayDetail} />
            {/key}
          {/if}
        </div>
      </div>
    </div>

    <div class="border-t border-gray-200 dark:border-gray-800 pt-8 space-y-4">
      <CalculateButton />
    </div>

    {#if appState.shoppingList.length > 0}
      <div class="border-t border-gray-200 dark:border-gray-800 pt-8 space-y-4">
        <ShoppingList />
        <ExportButton />
      </div>
    {/if}

    <div class="border-t border-gray-200 dark:border-gray-800 pt-8 flex justify-center">
      <ConfigButtons />
    </div>
  {/if}
</main>
