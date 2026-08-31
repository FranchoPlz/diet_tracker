<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';
  import { applyList, initializeLists, newStandaloneList } from '$lib/list-controller';
  import { deleteShoppingList } from '$lib/storage';

  let open = $state(false);
  onMount(() => { void initializeLists(); });

  async function remove(id: string) {
    await deleteShoppingList(id);
    await initializeLists();
  }
</script>

<div class="relative">
  <button class="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-600 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => open = !open}>Mis listas</button>
  {#if open}
    <div class="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-700 dark:bg-stone-900">
      <button class="mb-2 w-full rounded-xl bg-teal-700 px-3 py-2.5 text-sm font-bold text-white" onclick={() => { void newStandaloneList(); open = false; }}>+ Nueva lista</button>
      <div class="max-h-72 space-y-1 overflow-y-auto">
        {#each appState.savedLists as list}
          <div class="flex items-center gap-1 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800">
            <button class="min-w-0 flex-1 px-3 py-2 text-left" onclick={() => { applyList(list); open = false; }}>
              <span class="block truncate text-sm font-bold">{list.name}</span>
              <span class="text-xs text-stone-400">{list.items.length} productos</span>
            </button>
            <button class="px-3 py-2 text-red-400" onclick={() => void remove(list.id)} aria-label="Eliminar {list.name}">×</button>
          </div>
        {:else}
          <p class="p-4 text-center text-sm text-stone-400">Todavía no hay listas guardadas.</p>
        {/each}
      </div>
    </div>
  {/if}
</div>
