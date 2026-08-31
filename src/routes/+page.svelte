<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import CalculateButton from '$lib/components/CalculateButton.svelte';
  import ConfigButtons from '$lib/components/ConfigButtons.svelte';
  import DayDetail from '$lib/components/DayDetail.svelte';
  import DietAccordion from '$lib/components/DietAccordion.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import PdfUpload from '$lib/components/PdfUpload.svelte';
  import ShoppingList from '$lib/components/ShoppingList.svelte';
  import WeekGrid from '$lib/components/WeekGrid.svelte';

  let selectedDayIndex = $state<number | null>(0);
</script>

<svelte:head><title>Mi semana · Planificador de dieta</title></svelte:head>

<main class="mx-auto max-w-[1480px] px-4 pb-16 sm:px-6 lg:px-8">
  <header class="mb-8 max-w-3xl">
    <p class="mb-2 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Plan semanal</p>
    <h1 class="text-4xl font-black tracking-[-0.04em] text-stone-950 dark:text-white sm:text-6xl">Del menú al carro,<br /><span class="text-stone-400">sin hacer cuentas.</span></h1>
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-400">Carga tu dieta, decide qué comerás durante los próximos siete días y llévate una lista de compra con las cantidades ya sumadas.</p>
  </header>

  <PdfUpload />

  {#if appState.parsedData}
    <div class="mt-8 space-y-6">
      <WeekGrid onDayClick={(index) => selectedDayIndex = index} {selectedDayIndex} />

      <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div>
          {#if selectedDayIndex !== null}
            {#key selectedDayIndex}
              <DayDetail dayIndex={selectedDayIndex} onClose={() => selectedDayIndex = null} />
            {/key}
          {:else}
            <button class="w-full rounded-3xl border-2 border-dashed border-stone-300 p-12 text-stone-500 hover:border-orange-500" onclick={() => selectedDayIndex = 0}>Selecciona un día para editar sus comidas</button>
          {/if}
        </div>

        <aside class="space-y-4 xl:sticky xl:top-4">
          <div class="rounded-3xl border border-stone-200 bg-stone-950 p-5 text-white shadow-sm dark:border-stone-700">
            <p class="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Tu semana está lista</p>
            <h2 class="mb-4 text-xl font-black">Suma lo que necesitas</h2>
            <CalculateButton />
          </div>
          <ShoppingList />
          {#if appState.shoppingList.length > 0}<ExportButton />{/if}
        </aside>
      </div>

      <details class="rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
        <summary class="cursor-pointer px-5 py-4 text-sm font-bold text-stone-600 dark:text-stone-300">Consultar el contenido original de las dietas</summary>
        <div class="border-t border-stone-200 p-5 dark:border-stone-700"><DietAccordion /></div>
      </details>

      <div class="flex justify-center pt-2"><ConfigButtons /></div>
    </div>
  {/if}
</main>
