<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';

  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);

  const isDisabled = $derived(
    appState.shoppingList.length === 0 ||
    appState.loading
  );

  async function handleExport() {
    appState.loading = true;
    appState.error = null;

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const outputPath = await save({ filters: [{ name: 'CSV', extensions: ['csv'] }] });

      if (!outputPath) {
        // User cancelled the dialog
        return;
      }

      const totalsJson = JSON.stringify({
        totals: appState.shoppingList.map(item => ({
          ingredient: item.name,
          quantity: item.quantity,
          unit: item.unit,
        })),
      });

      await invoke<string>('export_csv', { totalsJson, outputPath });
      alert('CSV guardado en ' + outputPath);
    } catch (e) {
      console.error('Error exporting CSV:', e);
      appState.error = 'Error al exportar CSV: ' + String(e);
    } finally {
      appState.loading = false;
    }
  }
</script>

{#if isTauri}
  <div class="w-full">
    <button
      class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow"
      onclick={handleExport}
      disabled={isDisabled}
    >
      {#if appState.loading}
        Exportando...
      {:else}
        Exportar CSV
      {/if}
    </button>

    {#if appState.error}
      <div class="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
        {appState.error}
      </div>
    {/if}
  </div>
{/if}
