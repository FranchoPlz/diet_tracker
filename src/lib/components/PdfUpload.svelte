<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { appState } from '$lib/state.svelte';
  import type { ParseResult } from '$lib/types';
  import { createWorkspaceFromDocument } from '$lib/workspace-controller';

  let { actionLabel = 'Cambiar PDF' } = $props<{ actionLabel?: string }>();

  let isDragging = $state(false);
  let isParsing = $state(false);
  let fileInput = $state<HTMLInputElement>();

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

  function confirmReplacement(): boolean {
    return !appState.parsedData || confirm('¿Quieres sustituir el plan actual? Se conservará en Mis planes, pero la configuración activa cambiará al nuevo PDF.');
  }

  async function processTauriPath(path: string) {
    isParsing = true;
    appState.loading = true;
    appState.error = null;

    try {
      // Rust returns raw JSON string — must JSON.parse()
      const jsonStr = await invoke<string>('parse_pdf', { path });
      const result: ParseResult = JSON.parse(jsonStr);
      await createWorkspaceFromDocument(result, fileName(path));
    } catch (e) {
      console.error('Error parsing PDF:', e);
      appState.error = String(e);
    } finally {
      isParsing = false;
      appState.loading = false;
    }
  }

  async function processBrowserFile(file: File) {
    isParsing = true;
    appState.loading = true;
    appState.error = null;
    try {
      const { parseBrowserPdf } = await import('$lib/pdf');
      const result = await parseBrowserPdf(file);
      await createWorkspaceFromDocument(result, file.name);
    } catch (e) {
      console.error('Error parsing PDF:', e);
      appState.error = e instanceof Error ? e.message : String(e);
    } finally {
      isParsing = false;
      appState.loading = false;
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const file = e.dataTransfer?.files[0];
    if (!isTauri && file) {
      if (!confirmReplacement()) return;
      await processBrowserFile(file);
      return;
    }

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
        if (confirmReplacement()) void processTauriPath(path);
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
    if (!confirmReplacement()) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const path = await open({ filters: [{ name: 'PDF', extensions: ['pdf'] }] });
      if (path) await processTauriPath(path as string);
    } catch (e) {
      console.error('Error opening file dialog:', e);
      appState.error = String(e);
    }
  }

  async function handleBrowserFileSelect(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (file) await processBrowserFile(file);
  }

  function requestBrowserFileSelect() {
    if (confirmReplacement()) fileInput?.click();
  }

  function fileName(path: string): string {
    return path.split(/[\\/]/).pop() || path;
  }
</script>

<div class="mb-8 w-full">
  {#if isParsing}
    <div class="relative overflow-hidden rounded-2xl border border-teal-200 bg-white px-5 py-5 shadow-sm dark:border-teal-900 dark:bg-stone-900" role="status" aria-live="polite">
      <div class="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-teal-100 dark:bg-teal-950">
        <div class="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-teal-600"></div>
      </div>
      <div class="flex items-center gap-4">
        <span class="grid size-11 shrink-0 place-items-center rounded-full bg-teal-100 dark:bg-teal-950">
          <span class="size-5 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"></span>
        </span>
        <div>
          <p class="font-black text-stone-900 dark:text-white">Leyendo y organizando tu dieta</p>
          <p class="mt-0.5 text-sm text-stone-500 dark:text-stone-400">Estamos reconociendo comidas, opciones y cantidades del PDF.</p>
        </div>
      </div>
    </div>
  {:else if appState.parsedData}
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-stone-800 dark:bg-stone-900/70"
      ondragenter={handleDragEnter}
      ondragleave={handleDragLeave}
      ondragover={handleDragOver}
      ondrop={handleDrop}
      role="region"
      aria-label="PDF cargado"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">✓</span>
        <span class="min-w-0">
          <span class="block text-xs font-bold uppercase tracking-wider text-stone-400">PDF cargado</span>
          <span class="block truncate font-bold text-stone-700 dark:text-stone-200">{appState.pdfPath ? fileName(appState.pdfPath) : `${appState.activePlanName}.pdf`}</span>
        </span>
      </div>
      {#if isTauri}
        <button class="rounded-lg px-3 py-2 font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white" onclick={handleTauriFileSelect}>{actionLabel}</button>
      {:else}
        <button class="rounded-lg px-3 py-2 font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white" onclick={requestBrowserFileSelect}>{actionLabel}</button>
      {/if}
    </div>
  {:else}
    <div
      class="rounded-3xl border-2 border-dashed p-8 text-center transition {isDragging ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' : 'border-stone-300 bg-white/50 hover:border-teal-500 dark:border-stone-700 dark:bg-stone-900/50'}"
      ondragenter={handleDragEnter}
      ondragleave={handleDragLeave}
      ondragover={handleDragOver}
      ondrop={handleDrop}
      role="region"
      aria-label="Subir PDF"
    >
      <div class="flex flex-col items-center justify-center space-y-4">
        <span class="grid size-14 place-items-center rounded-2xl bg-teal-100 text-2xl dark:bg-teal-950" role="img" aria-label="Archivo PDF">PDF</span>
        <div>
          <p class="text-lg font-black text-stone-800 dark:text-stone-100">Carga tu plan de dieta</p>
          <p class="mt-1 text-sm text-stone-500">Arrastra el PDF aquí o selecciónalo desde tu equipo.</p>
        </div>
        {#if isTauri}
          <button class="rounded-xl bg-teal-700 px-5 py-2.5 font-bold text-white shadow-sm hover:bg-teal-800" onclick={handleTauriFileSelect}>Seleccionar PDF</button>
        {:else}
          <button class="rounded-xl bg-teal-700 px-5 py-2.5 font-bold text-white shadow-sm hover:bg-teal-800" onclick={requestBrowserFileSelect}>Seleccionar PDF</button>
        {/if}
      </div>
    </div>
  {/if}

  {#if !isTauri}
    <input bind:this={fileInput} type="file" accept="application/pdf,.pdf" class="hidden" onchange={handleBrowserFileSelect} />
  {/if}

  {#if appState.error}
    <div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
      {appState.error}
    </div>
  {/if}
</div>

<style>
  @keyframes loading {
    from { transform: translateX(-100%); }
    to { transform: translateX(400%); }
  }
</style>
