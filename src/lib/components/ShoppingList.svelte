<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { formatQuantity } from '$lib/utils';
</script>

{#if appState.shoppingList.length > 0}
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Lista de la Compra</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {appState.shoppingList.length} ingredientes
      </p>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead class="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3 font-medium">Ingrediente</th>
            <th scope="col" class="px-6 py-3 font-medium">Cantidad</th>
            <th scope="col" class="px-6 py-3 font-medium">Unidad</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each appState.shoppingList as item, i}
            <tr class={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}>
              <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
              <td class="px-6 py-4">{formatQuantity(item.quantity, item.unit)}</td>
              <td class="px-6 py-4 text-gray-500 dark:text-gray-500">{item.unit || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
