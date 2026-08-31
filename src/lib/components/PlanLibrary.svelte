<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/state.svelte';
  import { calculateActivePlan, duplicatePlan, initializePlans, persistCurrentPlan, renamePlan, restorePlan } from '$lib/plan-controller';
  import { deletePlan } from '$lib/storage';

  let open = $state(false);
  let editingId = $state<string | null>(null);
  let draftName = $state('');

  onMount(() => { void initializePlans(); });

  async function saveCurrent() {
    await persistCurrentPlan();
    open = false;
  }

  async function remove(id: string) {
    await deletePlan(id);
    if (appState.activePlanId === id) appState.activePlanId = null;
    await initializePlans();
  }
</script>

<div class="relative">
  <button class="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-600 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200" onclick={() => open = !open}>Mis planes</button>
  {#if open}
    <div class="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-stone-200 bg-white p-3 shadow-xl dark:border-stone-700 dark:bg-stone-900">
      {#if appState.parsedData}
        <div class="mb-3 flex gap-2">
          <input bind:value={appState.activePlanName} aria-label="Nombre del plan" class="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-bold outline-none focus:border-teal-600 dark:border-stone-700 dark:bg-stone-800" />
          <button class="rounded-xl bg-teal-700 px-3 py-2 text-sm font-bold text-white" onclick={() => void saveCurrent()}>Guardar</button>
        </div>
        {#if appState.activePlanId}
          <button class="mb-2 w-full rounded-xl border border-teal-200 px-3 py-2 text-sm font-bold text-teal-700 dark:border-teal-900 dark:text-teal-300" onclick={() => { calculateActivePlan(); open = false; }}>Recalcular desde el plan</button>
        {/if}
      {/if}
      <div class="max-h-72 space-y-1 overflow-y-auto">
        {#each appState.savedPlans as plan}
          <div class="rounded-xl p-2 hover:bg-stone-50 dark:hover:bg-stone-800">
            {#if editingId === plan.id}
              <form class="flex gap-1" onsubmit={(event) => { event.preventDefault(); void renamePlan(plan, draftName); editingId = null; }}>
                <input bind:value={draftName} aria-label="Nuevo nombre" class="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-900" />
                <button class="rounded-lg px-2 text-xs font-bold text-teal-700" type="submit">Listo</button>
              </form>
            {:else}
              <button class="w-full text-left" onclick={() => { void restorePlan(plan); open = false; }}>
                <span class="block truncate text-sm font-bold">{plan.name}</span>
                <span class="text-xs text-stone-400">{new Date(plan.updatedAt).toLocaleDateString()} · {plan.shoppingListId ? 'con lista' : 'sin lista'}</span>
              </button>
              <div class="mt-1 flex gap-1 text-xs font-bold">
                <button class="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700" onclick={() => { editingId = plan.id; draftName = plan.name; }}>Renombrar</button>
                <button class="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700" onclick={() => void duplicatePlan(plan)}>Duplicar</button>
                <button class="ml-auto rounded-lg px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950" onclick={() => void remove(plan.id)}>Eliminar</button>
              </div>
            {/if}
          </div>
        {:else}
          <p class="p-4 text-center text-sm text-stone-400">Todavía no hay planes guardados.</p>
        {/each}
      </div>
    </div>
  {/if}
</div>
