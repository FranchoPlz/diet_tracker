<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import { buildExportPayload } from '$lib/utils';

  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);
  const isDisabled = $derived(!appState.parsedData || appState.shoppingList.length === 0 || appState.loading);

  async function handleExport(format: 'json' | 'xlsx') {
    if (!appState.parsedData) return;
    appState.loading = true;
    appState.error = null;

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const label = format === 'json' ? 'JSON' : 'Excel';
      const outputPath = await save({
        defaultPath: `plan-semanal.${format}`,
        filters: [{ name: label, extensions: [format] }],
      });
      if (!outputPath) return;

      const payload = buildExportPayload(
        appState.parsedData,
        appState.weekConfig,
        appState.pdfPath,
        appState.shoppingList,
      );
      await invoke<string>('export_plan', {
        planJson: JSON.stringify(payload),
        outputPath,
        format,
      });
      alert(`${label} guardado en ${outputPath}`);
    } catch (error) {
      console.error('Error exporting plan:', error);
      appState.error = 'Error al exportar: ' + String(error);
    } finally {
      appState.loading = false;
    }
  }
</script>

{#if isTauri}
  <div class="grid grid-cols-2 gap-2">
    <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => handleExport('json')} disabled={isDisabled}>
      Exportar JSON
    </button>
    <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => handleExport('xlsx')} disabled={isDisabled}>
      Exportar Excel
    </button>
  </div>
{/if}
