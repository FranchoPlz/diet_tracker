<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { buildExportPayload, downloadBlob, fileSlug } from '$lib/utils';

  const isDisabled = $derived(!appState.parsedData || appState.loading);

  async function exportDietPdf() {
    if (!appState.parsedData) return;
    const { createPlanPdfBlob } = await import('$lib/pdf-export');
    const payload = buildExportPayload(appState.parsedData, appState.weekConfig);
    const blob = createPlanPdfBlob(payload, appState.activePlanName || 'Dieta seleccionada');
    const exportedAt = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `${fileSlug(appState.activePlanName || 'dieta-seleccionada')}-dieta-${exportedAt}.pdf`);
  }
</script>

<button
  class="app-accent-button w-full rounded-xl px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
  onclick={exportDietPdf}
  disabled={isDisabled}
>
  Exportar dieta a PDF
</button>
