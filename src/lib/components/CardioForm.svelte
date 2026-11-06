<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import type { CardioEntry } from '$lib/types';
  import { dayRecordKey, setCardio, setSteps } from '$lib/week-tracker';
  import { flushWorkspaceAutosave } from '$lib/workspace-controller';

  let { dayIndex }: { dayIndex: number } = $props();

  const cardioKey = $derived(dayRecordKey(dayIndex));
  const cardio = $derived(
    appState.weekTracker.cardioByDay?.[cardioKey]
      ?? { activity: '', duration: '', distance: '', intensity: '', calories: '', notes: '' }
  );

  function updateCardio(field: keyof CardioEntry, value: string) {
    setCardio(dayIndex, { ...cardio, [field]: value });
  }
</script>

<section class="border-t border-stone-200 p-4 dark:border-stone-700">
  <h3 class="text-lg font-black">Registrar cardio</h3>
  <p class="text-sm text-stone-500">Disponible todos los días como sesión principal o complemento.</p>
  <div class="mt-3 grid gap-3 sm:grid-cols-2">
    <label class="text-sm font-bold">
      Actividad
      <input
        class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
        placeholder="Cinta, bici, caminar…"
        value={cardio.activity}
        oninput={(e) => updateCardio('activity', e.currentTarget.value)}
      />
    </label>
    <label class="text-sm font-bold">
      Duración (min)
      <input
        type="number"
        inputmode="numeric"
        min="0"
        class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
        value={cardio.duration}
        oninput={(e) => updateCardio('duration', e.currentTarget.value)}
      />
    </label>
    <label class="text-sm font-bold">
      Distancia opcional
      <input
        class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
        placeholder="Ej. 5 km"
        value={cardio.distance}
        oninput={(e) => updateCardio('distance', e.currentTarget.value)}
      />
    </label>
    <label class="text-sm font-bold">
      Intensidad / ritmo / inclinación
      <input
        class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
        value={cardio.intensity}
        oninput={(e) => updateCardio('intensity', e.currentTarget.value)}
      />
    </label>
    <label class="text-sm font-bold">
      Calorías opcionales
      <input
        type="number"
        inputmode="numeric"
        min="0"
        class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
        value={cardio.calories}
        oninput={(e) => updateCardio('calories', e.currentTarget.value)}
      />
    </label>
    <label class="text-sm font-bold">
      Notas
      <input
        class="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3"
        value={cardio.notes}
        oninput={(e) => updateCardio('notes', e.currentTarget.value)}
      />
    </label>
  </div>
</section>
<section class="border-t border-stone-200 p-4 dark:border-stone-700">
  <label class="block text-lg font-black">
    Pasos del día
    <input
      type="number"
      inputmode="numeric"
      min="0"
      step="1"
      class="mt-2 min-h-12 w-full rounded-xl border bg-transparent px-4"
      value={appState.weekTracker.stepsByDay?.[cardioKey] ?? ''}
      oninput={(e) => setSteps(dayIndex, e.currentTarget.value)}
      onblur={() => void flushWorkspaceAutosave()}
    />
  </label>
</section>
