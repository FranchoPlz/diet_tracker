<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import { buildExportPayload } from '$lib/utils';

  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);
  const isDataDisabled = $derived(!appState.parsedData || appState.shoppingList.length === 0 || appState.loading);

  function exportPayload() {
    if (!appState.parsedData) return null;
    return buildExportPayload(appState.parsedData, appState.weekConfig, appState.pdfPath, appState.shoppingList);
  }

  async function handleExport(format: 'json' | 'xlsx') {
    if (!appState.parsedData) return;
    appState.loading = true;
    appState.error = null;

    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const label = format === 'json' ? 'JSON' : 'Excel';
      const outputPath = await save({
        defaultPath: `plan-semanal-${new Date().toISOString().slice(0, 10)}.${format}`,
        filters: [{ name: label, extensions: [format] }],
      });
      if (!outputPath) return;

      const payload = exportPayload();
      if (!payload) return;
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
    <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => handleExport('json')} disabled={isDataDisabled}>
      Exportar JSON
    </button>
    <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => handleExport('xlsx')} disabled={isDataDisabled}>
      Exportar Excel
    </button>
  </div>
{/if}
