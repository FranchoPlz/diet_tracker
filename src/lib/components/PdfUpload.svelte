<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import type { ParseResult } from '$lib/types';

  let isDragging = $state(false);

  // Detect if we are in Tauri context
  const isTauri = $derived(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  async function processFile(path: string) {
    appState.loading = true;
    appState.error = null;

    try {
      // Rust returns raw JSON string — must JSON.parse()
      const jsonStr = await invoke<string>('parse_pdf', { path });
      const result: ParseResult = JSON.parse(jsonStr);
      appState.parsedData = result;
      appState.pdfPath = path;
    } catch (e) {
      console.error('Error parsing PDF:', e);
      appState.error = String(e);
      appState.parsedData = null;
    } finally {
      appState.loading = false;
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    if (!isTauri) {
      appState.error = 'Arrastrar archivos solo funciona en modo Tauri. Usa el botón "Cargar datos de prueba" para explorar la interfaz.';
      return;
    }

    const file = e.dataTransfer?.files[0];
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      appState.error = 'Por favor, selecciona un archivo PDF válido.';
    }
  }

  onMount(() => {
    if (!isTauri) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;
    void import('@tauri-apps/api/window').then(async ({ getCurrentWindow }) => {
      unlisten = await getCurrentWindow().onDragDropEvent((event) => {
        if (event.payload.type === 'enter' || event.payload.type === 'over') {
          isDragging = true;
          return;
        }

        isDragging = false;
        if (event.payload.type !== 'drop') return;

        const path = event.payload.paths.find((droppedPath) => droppedPath.toLowerCase().endsWith('.pdf'));
        if (!path) {
          appState.error = 'Por favor, selecciona un archivo PDF válido.';
          return;
        }
        void processFile(path);
      });
      if (disposed) unlisten();
    }).catch((e) => {
      console.error('Error registering drag and drop:', e);
      appState.error = String(e);
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  });

  async function handleTauriFileSelect() {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const path = await open({ filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (path) await processFile(path as string);
    } catch (e) {
      console.error('Error opening file dialog:', e);
      appState.error = String(e);
    }
  }

  async function loadMockData() {
    appState.loading = true;
    appState.error = null;
    try {
      const goldenJson = await import('../../../tests/fixtures/abril_golden.json');
      appState.parsedData = goldenJson.default as ParseResult;
      appState.pdfPath = 'tests/fixtures/abril_golden.json';
    } catch (e) {
      console.error('Error loading mock data:', e);
      appState.error = 'Error cargando datos de prueba: ' + String(e);
    } finally {
      appState.loading = false;
    }
  }
</script>

<div class="w-full mb-8">
  <div
    class="border-2 border-dashed rounded-lg p-8 text-center {isDragging ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}"
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    role="region"
    aria-label="Subir PDF"
  >
    <div class="flex flex-col items-center justify-center space-y-4">
      <span class="text-4xl" role="img" aria-label="PDF file">📄</span>
      <p class="text-lg text-gray-700 dark:text-gray-300">Arrastra tu PDF aquí o selecciona un archivo</p>

      <div class="flex flex-wrap justify-center gap-4">
        {#if isTauri}
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow"
            onclick={handleTauriFileSelect}
            disabled={appState.loading}
          >
            Seleccionar archivo
          </button>
        {:else}
          <button
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded shadow"
            onclick={loadMockData}
            disabled={appState.loading}
          >
            Cargar datos de prueba
          </button>
        {/if}
      </div>
    </div>
  </div>

  {#if appState.loading}
    <div class="mt-4 text-center text-blue-600 dark:text-blue-400">
      Cargando...
    </div>
  {/if}

  {#if appState.error}
    <div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {appState.error}
    </div>
  {/if}
</div>
