<script lang="ts">
  import { appState } from '$lib/state.svelte';
  
  let isTauri = false;
  
  import { onMount } from 'svelte';
  
  onMount(() => {
    isTauri = '__TAURI_INTERNALS__' in window;
  });

  async function handleSave() {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      
      const path = await save({ filters: [{ name: 'JSON', extensions: ['json'] }] });
      if (!path) return;
      
      const config = {
        version: 1,
        pdfName: appState.pdfPath,
        weekConfig: appState.weekConfig
      };
      
      await writeTextFile(path, JSON.stringify(config, null, 2));
      alert('Configuración guardada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración.');
    }
  }

  async function handleLoad() {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      
      const path = await open({ filters: [{ name: 'JSON', extensions: ['json'] }] });
      if (!path) return;
      
      const content = await readTextFile(path as string);
      const data = JSON.parse(content);
      
      if (data.version !== 1 || !data.weekConfig) {
        alert('Formato de configuración inválido.');
        return;
      }

      data.weekConfig.weeks = 1;
      data.weekConfig.days = data.weekConfig.days.slice(0, 7);
      data.weekConfig.dayExceptions = Object.fromEntries(
        Object.entries(data.weekConfig.dayExceptions ?? {}).filter(([dayIndex]) => Number(dayIndex) < 7),
      );
      appState.weekConfig = data.weekConfig;
      appState.shoppingList = [];
      appState.checkedShoppingItems = {};
      alert('Configuración cargada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al cargar la configuración.');
    }
  }
</script>

{#if isTauri}
  <div class="flex gap-4">
    <button
      type="button"
      onclick={handleSave}
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      Guardar Configuración
    </button>
    
    <button
      type="button"
      onclick={handleLoad}
      class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      Cargar Configuración
    </button>
  </div>
{/if}
