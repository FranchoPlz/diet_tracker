<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { calculateShoppingList } from '$lib/calculation';
  import { completeConfiguration, scheduleWorkspaceAutosave, selectActiveTab } from '$lib/workspace-controller';
  import AppTabs, { type AppTab } from '$lib/components/AppTabs.svelte';
  import CalculateButton from '$lib/components/CalculateButton.svelte';
  import ConfigButtons from '$lib/components/ConfigButtons.svelte';
  import DayDetail from '$lib/components/DayDetail.svelte';
  import DietAccordion from '$lib/components/DietAccordion.svelte';
  import DietOverview from '$lib/components/DietOverview.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import GlobalDietConfiguration from '$lib/components/GlobalDietConfiguration.svelte';
  import HomeOverview from '$lib/components/HomeOverview.svelte';
  import PdfUpload from '$lib/components/PdfUpload.svelte';
  import ShareImport from '$lib/components/ShareImport.svelte';
  import ShareList from '$lib/components/ShareList.svelte';
  import ShoppingList from '$lib/components/ShoppingList.svelte';
  import TrainingView from '$lib/components/TrainingView.svelte';

  let reconfiguring = $state(false);
  let exceptionDayIndex = $state<number | null>(null);
  let gestureStart = $state<{ x: number; y: number; target: EventTarget | null } | null>(null);

  function setTab(tab: AppTab) {
    void selectActiveTab(tab);
  }

  function startGesture(event: PointerEvent) {
    gestureStart = { x: event.clientX, y: event.clientY, target: event.target };
  }

  function endGesture(event: PointerEvent) {
    if (!gestureStart) return;
    const start = gestureStart;
    gestureStart = null;
    const distanceX = event.clientX - start.x;
    const distanceY = event.clientY - start.y;
    if (Math.abs(distanceX) < 72 || Math.abs(distanceX) < Math.abs(distanceY)) return;
    if (start.target instanceof Element && start.target.closest('button, input, select, textarea, summary, a, label')) return;
    const tabs: AppTab[] = ['home', 'diet', 'training', 'shopping'];
    const next = tabs[tabs.indexOf(appState.activeTab) + (distanceX < 0 ? 1 : -1)];
    if (next) setTab(next);
  }

  async function saveConfiguration() {
    if (!appState.parsedData) return;
    appState.shoppingList = calculateShoppingList(appState.parsedData, appState.weekConfig);
    appState.checkedShoppingItems = {};
    appState.activeListId = null;
    appState.activeListName = `${appState.activePlanName} - compra`;
    await completeConfiguration();
    reconfiguring = false;
    await selectActiveTab('home');
  }

  function openException(dayIndex: number) {
    exceptionDayIndex = dayIndex;
  }

  function closeException() {
    if (appState.parsedData) {
      appState.shoppingList = calculateShoppingList(appState.parsedData, appState.weekConfig);
      appState.checkedShoppingItems = {};
      appState.activeListId = null;
      appState.activeListName = `${appState.activePlanName} - compra`;
      scheduleWorkspaceAutosave(0);
    }
    exceptionDayIndex = null;
  }
</script>

<svelte:head><title>Mi semana · Planificador de dieta</title></svelte:head>

<main class="mx-auto w-full min-w-0 max-w-[1480px] px-4 pb-20 sm:px-6 lg:px-8">
  <ShareImport />

  {#if !appState.persistenceReady}
    <div class="grid min-h-64 place-items-center" role="status">
      <p class="font-bold text-stone-500">Recuperando tu plan…</p>
    </div>
  {:else if !appState.parsedData}
    <header class="mb-8 max-w-3xl">
      <p class="mb-2 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Plan semanal</p>
      <h1 class="text-4xl font-black tracking-[-0.04em] text-stone-950 dark:text-white sm:text-6xl">Del menú al carro,<br /><span class="text-stone-400">sin hacer cuentas.</span></h1>
      <p class="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-400">Carga tu dieta para configurar tus comidas, consultar el entrenamiento y preparar la compra.</p>
    </header>
    <PdfUpload />
    {#if appState.activeListId}
      <div class="mx-auto mt-8 max-w-2xl space-y-4"><ShoppingList /><ShareList /></div>
    {/if}
  {:else}
    <AppTabs active={appState.activeTab} onChange={setTab} shoppingCount={appState.shoppingList.length} />

    <div class="mt-4 touch-pan-y" role="tabpanel" tabindex="0" onpointerdown={startGesture} onpointerup={endGesture} onpointercancel={() => gestureStart = null}>
      {#if appState.activeTab === 'home'}
        <HomeOverview />
      {:else if appState.activeTab === 'diet'}
        <div class="space-y-5">
          {#if !appState.configured || reconfiguring}
            <GlobalDietConfiguration onComplete={() => void saveConfiguration()} />
          {:else if exceptionDayIndex !== null}
            <div class="space-y-3">
              <button class="rounded-xl border border-stone-300 px-4 py-2 text-sm font-bold dark:border-stone-700" onclick={closeException}>← Volver al resumen</button>
              {#key exceptionDayIndex}
                <DayDetail dayIndex={exceptionDayIndex} initialExceptionMode={true} onClose={closeException} />
              {/key}
            </div>
          {:else}
            <DietOverview onEditException={openException} />
            <div class="flex justify-center"><button class="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-black text-stone-700 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800" onclick={() => reconfiguring = true}>Reconfigurar dietas</button></div>
            <details class="rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
              <summary class="cursor-pointer px-5 py-4 text-sm font-bold text-stone-600 dark:text-stone-300">Consultar todas las opciones originales</summary>
              <div class="border-t border-stone-200 p-5 dark:border-stone-700"><DietAccordion /></div>
            </details>
          {/if}
        </div>
      {:else if appState.activeTab === 'training'}
        <TrainingView />
      {:else}
        <div class="mx-auto max-w-3xl space-y-4">
          <section class="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm dark:border-teal-900 dark:from-teal-950/60 dark:to-stone-900">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Lista de compra</p>
            <h2 class="mt-1 text-2xl font-black text-stone-900 dark:text-white">Productos de tu selección</h2>
            <p class="mb-4 mt-1 text-sm text-stone-500 dark:text-stone-400">Recalcula cuando cambies opciones o excepciones.</p>
            <CalculateButton />
          </section>
          <ShoppingList />
          <ShareList />
          {#if appState.shoppingList.length > 0}<ExportButton />{/if}
        </div>
      {/if}
    </div>
  {/if}
</main>
