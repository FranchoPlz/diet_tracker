<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';
  import { calculateShoppingList } from '$lib/calculation';
  import { completeConfiguration, selectActiveTab } from '$lib/workspace-controller';
  import AppTabs, { type AppTab } from '$lib/components/AppTabs.svelte';
  import DayNavigator from '$lib/components/DayNavigator.svelte';
  import CurrentDayDiet from '$lib/components/CurrentDayDiet.svelte';
  import DietPdfExportButton from '$lib/components/DietPdfExportButton.svelte';
  import GlobalDietConfiguration from '$lib/components/GlobalDietConfiguration.svelte';
  import HomeOverview from '$lib/components/HomeOverview.svelte';
  import PdfUpload from '$lib/components/PdfUpload.svelte';
  import ShareImport from '$lib/components/ShareImport.svelte';
  import ShoppingList from '$lib/components/ShoppingList.svelte';
  import { getSwipedTab } from '$lib/swipe';
  import TrainingView from '$lib/components/TrainingView.svelte';
  import { downloadTrainingPdf } from '$lib/training-export';
  import { setActiveDay, startNextWeek, syncActiveDay } from '$lib/week-tracker';

  let gestureStart = $state<{ x: number; y: number; target: EventTarget | null } | null>(null);
  let syncedPlanId = $state<string | null>(null);
  let dietEditDayIndex = $state<number | null>(null);

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
    dietEditDayIndex = null;
  }

  function openException(dayIndex: number) {
    setActiveDay(dayIndex);
    dietEditDayIndex = dayIndex;
    void selectActiveTab('diet');
  }
</script>

<svelte:head><title>Mi semana · DG Nutrición</title></svelte:head>

<main class="w-full min-w-0 pb-20">
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
    </div>
  {:else}
    <AppTabs active={appState.activeTab} onChange={setTab} shoppingCount={appState.shoppingList.length} />

    <div class="mx-auto mt-4 max-w-[1480px] touch-pan-y space-y-4 px-3 sm:px-6 lg:px-8" role="tabpanel" tabindex="0">
      {#if appState.activeTab === 'home'}
        <div class="space-y-4"><HomeOverview /><DayNavigator onSelect={selectDay} onNext={nextDay} /><CurrentDayDiet onEdit={openException} /></div>
      {:else if appState.activeTab === 'diet'}
        <div class="space-y-5">
          {#key dietEditDayIndex}
            <GlobalDietConfiguration initialDayIndex={dietEditDayIndex} onComplete={() => void saveConfiguration()} />
          {/key}
          <div class="flex justify-center"><DietPdfExportButton /></div>
        </div>
      {:else if appState.activeTab === 'training'}
        <div class="space-y-4"><DayNavigator onSelect={selectDay} onNext={nextDay} /><TrainingView /></div>
      {:else}
        <div class="mx-auto max-w-3xl">
          <ShoppingList />
        </div>
      {/if}
    </div>
  {/if}
</main>
