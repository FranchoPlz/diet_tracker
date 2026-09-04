<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';
  import { calculateShoppingList } from '$lib/calculation';
  import { completeConfiguration, scheduleWorkspaceAutosave, selectActiveTab } from '$lib/workspace-controller';
  import AppTabs, { type AppTab } from '$lib/components/AppTabs.svelte';
  import CalculateButton from '$lib/components/CalculateButton.svelte';
  import DayDetail from '$lib/components/DayDetail.svelte';
  import DayNavigator from '$lib/components/DayNavigator.svelte';
  import CurrentDayDiet from '$lib/components/CurrentDayDiet.svelte';
  import DietAccordion from '$lib/components/DietAccordion.svelte';
  import DietPdfExportButton from '$lib/components/DietPdfExportButton.svelte';
  import ExportButton from '$lib/components/ExportButton.svelte';
  import GlobalDietConfiguration from '$lib/components/GlobalDietConfiguration.svelte';
  import HomeOverview from '$lib/components/HomeOverview.svelte';
  import PdfUpload from '$lib/components/PdfUpload.svelte';
  import ShareImport from '$lib/components/ShareImport.svelte';
  import ShareList from '$lib/components/ShareList.svelte';
  import ShoppingList from '$lib/components/ShoppingList.svelte';
  import { getSwipedTab } from '$lib/swipe';
  import TrainingView from '$lib/components/TrainingView.svelte';
  import { downloadTrainingPdf } from '$lib/training-export';
  import { setActiveDay, startNextWeek, syncActiveDay } from '$lib/week-tracker';

  let reconfiguring = $state(false);
  let exceptionDayIndex = $state<number | null>(null);
  let gestureStart = $state<{ x: number; y: number; target: EventTarget | null } | null>(null);
  let syncedPlanId = $state<string | null>(null);

  $effect(() => {
    if (!appState.persistenceReady || !appState.parsedData || appState.activePlanId === syncedPlanId) return;
    syncedPlanId = appState.activePlanId;
    if (syncActiveDay()) void closeWeek();
  });

  function setTab(tab: AppTab) {
    void selectActiveTab(tab);
  }

  function startGesture(event: TouchEvent) {
    if (!appState.parsedData || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (touch) gestureStart = { x: touch.clientX, y: touch.clientY, target: event.target };
  }

  function endGesture(event: TouchEvent) {
    if (!gestureStart) return;
    const start = gestureStart;
    gestureStart = null;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const next = getSwipedTab(appState.activeTab, start, { x: touch.clientX, y: touch.clientY });
    if (next) setTab(next);
  }

  function cancelGesture() {
    gestureStart = null;
  }

  onMount(() => {
    const options = { passive: true, capture: true };
    window.addEventListener('touchstart', startGesture, options);
    window.addEventListener('touchend', endGesture, options);
    window.addEventListener('touchcancel', cancelGesture, options);

    return () => {
      window.removeEventListener('touchstart', startGesture, options);
      window.removeEventListener('touchend', endGesture, options);
      window.removeEventListener('touchcancel', cancelGesture, options);
    };
  });

  async function closeWeek() {
    const modifyDiet = confirm('Has completado la semana. ¿Quieres modificar la dieta para la siguiente?');
    const exportTraining = confirm('¿Quieres guardar el PDF del entrenamiento de esta semana antes de reiniciarlo?');
    if (exportTraining && appState.parsedData?.training) {
      downloadTrainingPdf(appState.parsedData.training, appState.weekTracker.trainingWeights, appState.activePlanName, appState.weekTracker.weekNumber);
    }
    const resetTraining = confirm('¿Quieres reiniciar también los pesos del entrenamiento para la nueva semana?');
    startNextWeek(resetTraining);
    if (modifyDiet) {
      reconfiguring = true;
      await selectActiveTab('diet');
    }
  }

  function selectDay(dayIndex: number) {
    if (appState.weekTracker.activeDayIndex === 6 && dayIndex === 0) {
      void closeWeek();
      return;
    }
    setActiveDay(dayIndex);
  }

  function nextDay() {
    if (appState.weekTracker.activeDayIndex === 6) void closeWeek();
    else setActiveDay(appState.weekTracker.activeDayIndex + 1);
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
    void selectActiveTab('diet');
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

<svelte:head><title>Mi semana · DG Nutrición</title></svelte:head>

<main class="w-full min-w-0 pb-20">
  <div class="dg-brand" aria-label="DG Diego Gularte Nutrición">
    <img class="dg-logo-dark" src="{base}/dg-logo-dark.png" alt="DG Diego Gularte Nutrición" />
    <img class="dg-logo-light" src="{base}/dg-logo-light.png" alt="" />
  </div>
  <ShareImport />

  {#if !appState.persistenceReady}
    <div class="mx-auto grid min-h-64 max-w-[1480px] place-items-center px-4 sm:px-6 lg:px-8" role="status">
      <p class="font-bold text-stone-500">Recuperando tu plan…</p>
    </div>
  {:else if !appState.parsedData}
    <div class="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
      <header class="mb-8 max-w-3xl">
        <p class="mb-2 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Plan semanal</p>
        <h1 class="text-4xl font-black tracking-[-0.04em] text-stone-950 dark:text-white sm:text-6xl">Del menú al carro,<br /><span class="text-stone-400">sin hacer cuentas.</span></h1>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-400">Carga tu dieta para configurar tus comidas, consultar el entrenamiento y preparar la compra.</p>
      </header>
      <PdfUpload />
      {#if appState.activeListId}
        <div class="mx-auto mt-8 max-w-2xl space-y-4"><ShoppingList /><ShareList /></div>
      {/if}
    </div>
  {:else}
    <AppTabs active={appState.activeTab} onChange={setTab} shoppingCount={appState.shoppingList.length} />

    <div class="mx-auto mt-4 max-w-[1480px] touch-pan-y space-y-4 px-3 sm:px-6 lg:px-8" role="tabpanel" tabindex="0">
      <DayNavigator onSelect={selectDay} onNext={nextDay} />
      {#if appState.activeTab === 'home'}
        <div class="space-y-4"><CurrentDayDiet onEdit={openException} /><HomeOverview /></div>
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
            <CurrentDayDiet onEdit={openException} />
            <div class="grid gap-2 sm:flex sm:justify-center">
              <DietPdfExportButton />
              <button class="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-black text-stone-700 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800" onclick={() => reconfiguring = true}>Reconfigurar dietas</button>
            </div>
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
