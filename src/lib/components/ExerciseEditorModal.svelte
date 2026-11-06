<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import { onMount } from 'svelte';
  import type { ExerciseType } from '$lib/types';

  let { editing, draft = $bindable(), onSave, onClose } = $props<{
    editing: boolean;
    draft: { exercise: string; type: ExerciseType; series: string; repetitions: string; duration: string; details: string; notes: string };
    onSave: () => void;
    onClose: () => void;
  }>();
  let nameInput = $state<HTMLInputElement>();

  onMount(() => nameInput?.focus());
</script>

<BottomSheet labelledby="exercise-editor-title" {onClose}>
  <header class="mb-5 flex items-center justify-between gap-3">
    <div><p class="text-xs font-black uppercase tracking-[0.18em] text-warm">Entrenamiento</p><h2 id="exercise-editor-title" class="text-xl font-black">{editing ? 'Editar ejercicio' : 'Añadir ejercicio'}</h2></div>
    <button type="button" class="grid min-h-11 min-w-11 place-items-center rounded-full border border-stone-300 text-xl font-black dark:border-stone-600" onclick={onClose} aria-label="Cerrar editor">×</button>
  </header>
  <form class="space-y-4" onsubmit={(event) => { event.preventDefault(); onSave(); }}>
    <label class="block text-sm font-bold">Nombre<input bind:this={nameInput} class="mt-1 min-h-12 w-full rounded-xl border bg-white px-3 dark:bg-stone-900" bind:value={draft.exercise} required /></label>
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="text-sm font-bold">Tipo<select class="mt-1 min-h-12 w-full rounded-xl border bg-white px-3 dark:bg-stone-900" bind:value={draft.type}><option value="strength">Fuerza</option><option value="cardio">Cardio</option><option value="warmup">Movilidad / calentamiento</option><option value="other">Otro</option></select></label>
      <label class="text-sm font-bold">Series<input type="number" min="1" max="20" class="mt-1 min-h-12 w-full rounded-xl border bg-white px-3 dark:bg-stone-900" bind:value={draft.series} /></label>
      <label class="text-sm font-bold" for="exercise-repetitions">Repeticiones objetivo</label><div><textarea id="exercise-repetitions" class="min-h-24 w-full resize-y rounded-xl border bg-white p-3 font-mono text-base leading-relaxed dark:bg-stone-900" placeholder={'Ej. 10\nO una línea por serie:\n1º - 10\n2º - 10\n3º - 8'} aria-describedby="repetitions-help" bind:value={draft.repetitions}></textarea><span id="repetitions-help" class="mt-1 block text-xs font-normal leading-relaxed text-stone-500">Puedes indicar un único valor, un rango como 8-12 o una línea distinta para cada serie.</span></div>
      <label class="text-sm font-bold">Duración<input class="mt-1 min-h-12 w-full rounded-xl border bg-white px-3 dark:bg-stone-900" placeholder="Ej. 20 minutos" bind:value={draft.duration} /></label>
    </div>
    <label class="block text-sm font-bold">Detalles<input class="mt-1 min-h-12 w-full rounded-xl border bg-white px-3 dark:bg-stone-900" bind:value={draft.details} /></label>
    <label class="block text-sm font-bold">Notas<textarea class="mt-1 min-h-24 w-full rounded-xl border bg-white p-3 dark:bg-stone-900" bind:value={draft.notes}></textarea></label>
    <div class="sticky bottom-0 flex gap-2 bg-[var(--surface)] pt-2">
      <button type="button" class="min-h-12 rounded-xl border px-4 font-black" onclick={onClose}>Cancelar</button>
      <button type="submit" class="app-accent-button min-h-12 flex-1 rounded-xl font-black">{editing ? 'Guardar cambios' : 'Añadir ejercicio'}</button>
    </div>
  </form>
</BottomSheet>
