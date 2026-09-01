<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { hasException } from '$lib/utils';
  import CalculateButton from './CalculateButton.svelte';
  import ConfigButtons from './ConfigButtons.svelte';

  let { onOpenDiet, onReconfigure, onOpenShopping }: {
    onOpenDiet: () => void;
    onReconfigure: () => void;
    onOpenShopping: () => void;
  } = $props();

  const exceptionCount = $derived(appState.weekConfig.days.filter((_, index) => hasException(appState.weekConfig, index)).length);
  const checkedCount = $derived(appState.shoppingList.filter(item => appState.checkedShoppingItems[`${item.name}|${item.unit ?? ''}`] ?? item.checked).length);
</script>

<section class="mx-auto max-w-3xl space-y-4" aria-labelledby="home-title">
  <header class="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-700 dark:bg-stone-900 sm:p-6">
    <p class="text-xs font-black uppercase tracking-[0.22em] text-orange-600">Plan activo</p>
    <h1 id="home-title" class="mt-1 text-3xl font-black tracking-tight text-stone-950 dark:text-white">{appState.activePlanName}</h1>
    <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">{appState.parsedData?.diets.length ?? 0} dietas · {exceptionCount} excepciones · {appState.shoppingList.length} productos</p>
  </header>

  <div class="grid gap-4 sm:grid-cols-2">
    <article class="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900 dark:bg-amber-950/20">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Dieta</p>
      <h2 class="mt-1 text-xl font-black text-stone-950 dark:text-white">Tus elecciones</h2>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">{appState.parsedData?.diets.length ?? 0} dietas configuradas · {exceptionCount} excepciones</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-700" onclick={onOpenDiet}>Ver dieta</button>
        <button class="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-black text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950" onclick={onReconfigure}>Reconfigurar</button>
      </div>
    </article>

    <article class="rounded-3xl border border-teal-200 bg-teal-50/60 p-5 dark:border-teal-900 dark:bg-teal-950/20">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Compra</p>
      <h2 class="mt-1 text-xl font-black text-stone-950 dark:text-white">Lista de la semana</h2>
      <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">{appState.shoppingList.length ? `${appState.shoppingList.length} productos · ${checkedCount} en el carro` : 'Aún no hay lista calculada.'}</p>
      <div class="mt-4 space-y-2">
        <CalculateButton />
        <button class="w-full rounded-xl border border-teal-300 px-4 py-2.5 text-sm font-black text-teal-900 hover:bg-teal-100 dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-950" onclick={onOpenShopping}>Abrir compra</button>
      </div>
    </article>
  </div>

  <details class="rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
    <summary class="cursor-pointer px-5 py-3 text-sm font-bold text-stone-600 dark:text-stone-300">Herramientas del plan</summary>
    <div class="border-t border-stone-200 p-4 dark:border-stone-700"><ConfigButtons /></div>
  </details>
</section>
