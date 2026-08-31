<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import CalculateButton from '$lib/components/CalculateButton.svelte';
  import ConfigButtons from '$lib/components/ConfigButtons.svelte';
  import DayDetail from '$lib/components/DayDetail.svelte';
  import DietAccordion from '$lib/components/DietAccordion.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import PdfUpload from '$lib/components/PdfUpload.svelte';
  import ShoppingList from '$lib/components/ShoppingList.svelte';
  import ShareImport from '$lib/components/ShareImport.svelte';
  import ShareList from '$lib/components/ShareList.svelte';
  import WeekGrid from '$lib/components/WeekGrid.svelte';

  let selectedDayIndex = $state<number | null>(0);
</script>

<svelte:head><title>Mi semana · Planificador de dieta</title></svelte:head>

<main class="mx-auto max-w-[1480px] px-4 pb-16 sm:px-6 lg:px-8">
  <ShareImport />
  <header class="mb-8 max-w-3xl">
    <p class="mb-2 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Plan semanal</p>
    <h1 class="text-4xl font-black tracking-[-0.04em] text-stone-950 dark:text-white sm:text-6xl">Del menú al carro,<br /><span class="text-stone-400">sin hacer cuentas.</span></h1>
    <p class="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-400">Carga tu dieta, decide qué comerás durante los próximos siete días y llévate una lista de compra con las cantidades ya sumadas.</p>
  </header>

  <PdfUpload />

  {#if appState.parsedData && !appState.pdfPath && appState.planSourceLabel}
    <div class="mb-8 flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-sm dark:border-teal-900 dark:bg-teal-950/30">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-700 font-black text-white">✓</span>
      <span><span class="block text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Fuente recuperada</span><span class="font-bold text-stone-700 dark:text-stone-200">{appState.planSourceLabel}</span></span>
    </div>
  {/if}

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
          <div class="overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm dark:border-teal-900 dark:from-teal-950/60 dark:to-stone-900">
            <div class="mb-4 flex items-start gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-700 font-black text-white">3</span>
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Lista de compra</p>
                <h2 class="mt-0.5 text-xl font-black text-stone-900 dark:text-white">Calcula las cantidades</h2>
                <p class="mt-1 text-sm leading-relaxed text-stone-500 dark:text-stone-400">Sumaremos los ingredientes de los siete días según tus elecciones.</p>
              </div>
            </div>
            <CalculateButton />
            {#if appState.activePlanId && !appState.pdfPath}<p class="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">Se calculará desde los datos guardados, sin necesitar el PDF original.</p>{/if}
          </div>
          <ShoppingList />
          <ShareList />
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

  {#if !appState.parsedData && appState.activeListId}
    <div class="mx-auto mt-8 max-w-2xl space-y-4"><ShoppingList /><ShareList /></div>
  {/if}
</main>
