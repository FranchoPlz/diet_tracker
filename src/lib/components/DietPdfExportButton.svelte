<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { buildExportPayload } from '$lib/utils';

  const isDisabled = $derived(!appState.parsedData || appState.loading);

  async function exportDietPdf() {
    if (!appState.parsedData) return;
    const { createPlanPdfBlob } = await import('$lib/pdf-export');
    const payload = buildExportPayload(appState.parsedData, appState.weekConfig, appState.pdfPath, appState.shoppingList);
    const blob = createPlanPdfBlob(payload, appState.activePlanName || 'Dieta seleccionada');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(appState.activePlanName || 'dieta-seleccionada').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
</script>

<button
  class="app-accent-button w-full rounded-xl px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
  onclick={exportDietPdf}
  disabled={isDisabled}
>
  Exportar dieta a PDF
</button>
