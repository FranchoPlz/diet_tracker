<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { applyList, initializeLists, persistCurrentList } from '$lib/list-controller';
  import { buildShareUrl, createListEnvelope, parseListFile } from '$lib/share';
  import { saveShoppingList } from '$lib/storage';

  let shareUrl = $state('');
  let qrMarkup = $state('');
  let message = $state('');
  let fileInput = $state<HTMLInputElement>();

  async function currentList() {
    return persistCurrentList();
  }

  async function prepareShare() {
    const list = await currentList();
    shareUrl = buildShareUrl(list, location.href);
    if (shareUrl.length <= 2800) {
      const { renderSVG } = await import('uqr');
      qrMarkup = renderSVG(shareUrl, { ecc: 'L', border: 2 });
    } else {
      qrMarkup = '';
      message = 'La lista es demasiado grande para un QR fiable. Usa el archivo JSON.';
    }
  }

  async function downloadJson() {
    const list = await currentList();
    const blob = new Blob([JSON.stringify(createListEnvelope(list), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${list.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'lista'}.diet-list.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const list = parseListFile(await file.text());
      await saveShoppingList(list);
      await initializeLists();
      applyList(list);
      message = 'Lista importada correctamente.';
    } catch (error) {
      message = String(error);
    }
  }

  async function systemShare() {
    await prepareShare();
    if (navigator.share && shareUrl) await navigator.share({ title: appState.activeListName, url: shareUrl });
    else await navigator.clipboard.writeText(shareUrl);
  }
</script>

{#if appState.activeListId || appState.shoppingList.length > 0}
  <section class="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button class="rounded-xl bg-teal-700 px-3 py-2 text-sm font-bold text-white" onclick={systemShare}>Compartir</button>
      <button class="rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold" onclick={prepareShare}>Mostrar QR</button>
      <button class="rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold" onclick={downloadJson}>Guardar archivo</button>
      <button class="rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold" onclick={() => fileInput?.click()}>Importar</button>
    </div>
    <input bind:this={fileInput} type="file" accept=".json,.diet-list.json,application/json" class="hidden" onchange={importFile} />
    {#if qrMarkup}
      <div class="mx-auto mt-4 max-w-64 rounded-xl bg-white p-3">{@html qrMarkup}</div>
      <p class="mt-2 break-all text-xs text-stone-400">{shareUrl}</p>
    {/if}
    {#if message}<p class="mt-3 text-sm text-stone-500">{message}</p>{/if}
  </section>
{/if}
