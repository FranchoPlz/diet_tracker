<script lang="ts">
  import { onMount } from 'svelte';
  import { applyList, initializeLists } from '$lib/list-controller';
  import { readSharedListFromHash } from '$lib/share';
  import { saveShoppingList } from '$lib/storage';

  let message = $state('');
  let isError = $state(false);

  onMount(() => {
    try {
      const imported = readSharedListFromHash(location.hash);
      if (!imported) return;

      void saveShoppingList(imported).then(async () => {
        await initializeLists();
        applyList(imported);
        history.replaceState(null, '', location.pathname + location.search);
        message = 'Lista compartida importada como una copia independiente.';
      }).catch((error) => {
        isError = true;
        message = error instanceof Error ? error.message : String(error);
      });
    } catch (error) {
      isError = true;
      message = error instanceof Error ? error.message : String(error);
    }
  });
</script>

{#if message}
  <div class="mb-6 rounded-2xl border px-4 py-3 text-sm font-bold {isError ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300' : 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200'}" role="status">
    {message}
  </div>
{/if}
