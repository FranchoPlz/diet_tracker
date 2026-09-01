<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import { buildExportPayload } from '$lib/utils';
  import { createPlanPdfBlob } from '$lib/pdf-export';

  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);
  const isPlanDisabled = $derived(!appState.parsedData || appState.loading);
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
        defaultPath: `plan-semanal.${format}`,
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

  function handlePdfExport() {
    const payload = exportPayload();
    if (!payload) return;
    const blob = createPlanPdfBlob(payload, appState.activePlanName || 'Plan semanal');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(appState.activePlanName || 'plan-semanal').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="grid gap-2 {isTauri ? 'grid-cols-3' : 'grid-cols-1'}">
  <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={handlePdfExport} disabled={isPlanDisabled}>
    Exportar PDF
  </button>
  {#if isTauri}
    <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => handleExport('json')} disabled={isDataDisabled}>
      Exportar JSON
    </button>
    <button class="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-700 hover:border-orange-500 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => handleExport('xlsx')} disabled={isDataDisabled}>
      Exportar Excel
    </button>
  {/if}
</div>
