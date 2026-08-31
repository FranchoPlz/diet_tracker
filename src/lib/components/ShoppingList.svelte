<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { persistCurrentList } from '$lib/list-controller';
  import { SHOPPING_CATEGORIES, normalizeShoppingItem } from '$lib/shopping';
  import { formatQuantity } from '$lib/utils';
  import type { ShoppingCategory } from '$lib/types';

  let search = $state('');
  let pendingOnly = $state(false);
  let editingId = $state<string | null>(null);

  const normalizedItems = $derived(appState.shoppingList.map(item => normalizeShoppingItem(item)));
  const checkedCount = $derived(normalizedItems.filter(item => appState.checkedShoppingItems[`${item.name}|${item.unit ?? ''}`] ?? item.checked).length);

  function visibleItems(category: ShoppingCategory) {
    return normalizedItems.filter(item => {
      const checked = appState.checkedShoppingItems[`${item.name}|${item.unit ?? ''}`] ?? item.checked;
      return item.category === category
        && item.name.toLowerCase().includes(search.trim().toLowerCase())
        && (!pendingOnly || !checked);
    });
  }

  function updateItem(id: string, field: string, value: string | number | null) {
    const index = appState.shoppingList.findIndex(item => normalizeShoppingItem(item).id === id);
    if (index === -1) return;
    appState.shoppingList[index] = { ...appState.shoppingList[index], id, [field]: value };
  }

  function addItem() {
    const item = normalizeShoppingItem({ name: 'Nuevo producto', quantity: 1, unit: 'unidad', count: 1, custom: true });
    appState.shoppingList = [...appState.shoppingList, item];
    editingId = item.id;
  }

  function removeItem(id: string) {
    appState.shoppingList = appState.shoppingList.filter(item => normalizeShoppingItem(item).id !== id);
  }
</script>

{#if appState.shoppingList.length > 0 || appState.activeListId}
  <section class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
    <div class="border-b border-stone-200 p-5 dark:border-stone-700">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">En el supermercado</p>
      <input bind:value={appState.activeListName} aria-label="Nombre de la lista" class="mt-1 w-full bg-transparent text-2xl font-black text-stone-900 outline-none dark:text-white" />
      <div class="mt-1 flex items-center justify-between gap-3">
        <p class="text-sm text-stone-500 dark:text-stone-400">{checkedCount} de {appState.shoppingList.length} en el carro</p>
        <label class="flex items-center gap-2 text-xs font-bold text-stone-500">
          <input type="checkbox" bind:checked={pendingOnly} class="accent-teal-700" /> Solo pendientes
        </label>
      </div>
      <div class="mt-4 flex gap-2">
        <input bind:value={search} type="search" placeholder="Buscar ingrediente" class="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-teal-600 dark:border-stone-700 dark:bg-stone-800" />
        <button class="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-700 text-xl font-black text-white" onclick={addItem} aria-label="Añadir producto">+</button>
      </div>
    </div>

    <div class="max-h-[40rem] overflow-y-auto">
      {#each SHOPPING_CATEGORIES as category}
        {@const items = visibleItems(category)}
        {#if items.length > 0}
          <details open class="border-b border-stone-100 last:border-0 dark:border-stone-800">
            <summary class="sticky top-0 z-10 cursor-pointer bg-stone-50 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-300">{category} · {items.length}</summary>
            <div class="divide-y divide-stone-100 dark:divide-stone-800">
              {#each items as item (item.id)}
                {@const key = `${item.name}|${item.unit ?? ''}`}
                <div class="flex items-start gap-3 px-5 py-3.5">
                  <input type="checkbox" bind:checked={appState.checkedShoppingItems[key]} class="mt-1 size-5 shrink-0 accent-teal-700" aria-label="Marcar {item.name}" />
                  <div class="min-w-0 flex-1">
                    {#if editingId === item.id}
                      <input value={item.name} oninput={(event) => updateItem(item.id, 'name', event.currentTarget.value)} class="w-full rounded-lg border border-stone-200 px-2 py-1 font-bold dark:border-stone-700 dark:bg-stone-800" aria-label="Producto" />
                      <div class="mt-2 grid grid-cols-3 gap-2">
                        <input type="number" step="any" value={item.quantity ?? ''} oninput={(event) => updateItem(item.id, 'quantity', event.currentTarget.value === '' ? null : Number(event.currentTarget.value))} class="min-w-0 rounded-lg border border-stone-200 px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-800" aria-label="Cantidad" />
                        <input value={item.unit ?? ''} oninput={(event) => updateItem(item.id, 'unit', event.currentTarget.value || null)} class="min-w-0 rounded-lg border border-stone-200 px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-800" aria-label="Unidad" />
                        <select value={item.category} onchange={(event) => updateItem(item.id, 'category', event.currentTarget.value)} class="min-w-0 rounded-lg border border-stone-200 px-2 py-1 text-xs dark:border-stone-700 dark:bg-stone-800" aria-label="Categoría">
                          {#each SHOPPING_CATEGORIES as choice}<option value={choice}>{choice}</option>{/each}
                        </select>
                      </div>
                    {:else}
                      <button class="w-full text-left" onclick={() => editingId = item.id}>
                        <span class="block truncate font-bold capitalize {appState.checkedShoppingItems[key] ? 'text-stone-400 line-through' : 'text-stone-800 dark:text-stone-100'}">{item.name}</span>
                        <span class="text-xs text-stone-500">{formatQuantity(item.quantity, item.unit)}</span>
                      </button>
                    {/if}
                  </div>
                  <div class="flex shrink-0 gap-1">
                    <button class="rounded-lg px-2 py-1 text-xs font-bold text-teal-700 hover:bg-teal-50 dark:text-teal-300" onclick={() => editingId = editingId === item.id ? null : item.id}>{editingId === item.id ? 'Listo' : 'Editar'}</button>
                    <button class="rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50" onclick={() => removeItem(item.id)} aria-label="Eliminar {item.name}">×</button>
                  </div>
                </div>
              {/each}
            </div>
          </details>
        {/if}
      {/each}
    </div>

    <div class="border-t border-stone-200 p-4 dark:border-stone-700">
      <button class="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-700 dark:bg-white dark:text-stone-900" onclick={() => void persistCurrentList()}>Guardar en este dispositivo</button>
    </div>
  </section>
{/if}
