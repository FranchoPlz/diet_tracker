<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { formatQuantity } from '$lib/utils';

  let search = $state('');
  let pendingOnly = $state(false);

  const filteredItems = $derived(appState.shoppingList.filter((item) => {
    const key = `${item.name}|${item.unit ?? ''}`;
    const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (!pendingOnly || !appState.checkedShoppingItems[key]);
  }));
  const checkedCount = $derived(Object.values(appState.checkedShoppingItems).filter(Boolean).length);
</script>

{#if appState.shoppingList.length > 0}
  <section class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
    <div class="border-b border-stone-200 p-5 dark:border-stone-700">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Paso 3</p>
      <div class="mt-1 flex items-end justify-between gap-3">
        <div>
          <h2 class="text-2xl font-black text-stone-900 dark:text-white">Lista de compra</h2>
          <p class="text-sm text-stone-500 dark:text-stone-400">{checkedCount} de {appState.shoppingList.length} en el carro</p>
        </div>
        <label class="flex items-center gap-2 text-xs font-bold text-stone-500">
          <input type="checkbox" bind:checked={pendingOnly} class="accent-orange-600" /> Solo pendientes
        </label>
      </div>
      <input
        bind:value={search}
        type="search"
        placeholder="Buscar ingrediente"
        class="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-stone-700 dark:bg-stone-800"
      />
    </div>

    <div class="max-h-[34rem] divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800">
      {#each filteredItems as item}
        {@const key = `${item.name}|${item.unit ?? ''}`}
        <label class="flex cursor-pointer items-center gap-3 px-5 py-3.5 hover:bg-orange-50/50 dark:hover:bg-stone-800">
          <input type="checkbox" bind:checked={appState.checkedShoppingItems[key]} class="size-5 accent-orange-600" />
          <span class="min-w-0 flex-1">
            <span class="block truncate font-bold capitalize {appState.checkedShoppingItems[key] ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-100'}">{item.name}</span>
            {#if item.quantity === null}<span class="text-xs text-amber-600">Cantidad no indicada en el PDF · aparece {item.count} {item.count === 1 ? 'vez' : 'veces'}</span>{/if}
          </span>
          <span class="shrink-0 rounded-full px-3 py-1 text-sm font-black {item.quantity === null ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-900'}">
            {formatQuantity(item.quantity, item.unit)}
          </span>
        </label>
      {/each}
      {#if filteredItems.length === 0}
        <p class="p-8 text-center text-sm text-stone-400">No hay ingredientes que mostrar.</p>
      {/if}
    </div>
  </section>
{/if}
