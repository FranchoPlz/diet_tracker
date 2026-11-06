<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import BottomSheet from './BottomSheet.svelte';

  let { onConfirm }: {
    onConfirm: (choices: { modifyDiet: boolean; exportTraining: boolean; resetTraining: boolean }) => void;
  } = $props();

  const hasTraining = $derived(Boolean(appState.parsedData?.training));
  let modifyDiet = $state(false);
  let exportTraining = $state(true);
  let resetTraining = $state(true);

  function confirm() {
    onConfirm({ modifyDiet, exportTraining: hasTraining && exportTraining, resetTraining });
  }
</script>

<BottomSheet labelledby="week-close-title" onClose={confirm}>
  <form
    class="space-y-4"
    onsubmit={(event) => { event.preventDefault(); confirm(); }}
  >
    <header>
      <p class="text-xs font-black uppercase tracking-[0.18em] text-warm">Semana {appState.weekTracker.weekNumber} completada</p>
      <h2 id="week-close-title" class="text-xl font-black">Empezar la siguiente semana</h2>
    </header>
    <fieldset class="space-y-2">
      <legend class="sr-only">Opciones para la nueva semana</legend>
      {#if appState.askToModifyDiet}
        <label class="flex min-h-11 items-center gap-3 text-sm font-bold">
          <input type="checkbox" class="size-5 accent-orange-600" bind:checked={modifyDiet} />
          Modificar la dieta para la siguiente semana
        </label>
      {/if}
      {#if hasTraining}
        <label class="flex min-h-11 items-center gap-3 text-sm font-bold">
          <input type="checkbox" class="size-5 accent-orange-600" bind:checked={exportTraining} />
          Guardar el PDF del entrenamiento de esta semana
        </label>
      {/if}
      <label class="flex min-h-11 items-center gap-3 text-sm font-bold">
        <input type="checkbox" class="size-5 accent-orange-600" bind:checked={resetTraining} />
        Reiniciar pesos y repeticiones del entrenamiento
      </label>
    </fieldset>
    <button type="submit" class="app-accent-button min-h-12 w-full rounded-xl font-black">
      Empezar semana {appState.weekTracker.weekNumber + 1}
    </button>
  </form>
</BottomSheet>
