<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { setAskToModifyDiet, setAutoDay, setCompactView, setDarkMode } from '$lib/preferences';

  const settings = [
    {
      label: 'Vista compacta',
      description: 'Muestra más días, comidas y productos reduciendo espacios y tamaños.',
      checked: () => appState.compactView,
      update: setCompactView,
    },
    {
      label: 'Día automático',
      description: 'Selecciona automáticamente el día actual de lunes a domingo.',
      checked: () => appState.autoDay,
      update: setAutoDay,
    },
    {
      label: 'Preguntar por la dieta',
      description: 'Pregunta si quieres modificar la dieta al comenzar otra semana.',
      checked: () => appState.askToModifyDiet,
      update: setAskToModifyDiet,
    },
    {
      label: 'Modo oscuro',
      description: 'Usa la apariencia oscura de la aplicación.',
      checked: () => appState.darkMode,
      update: setDarkMode,
    },
  ];
</script>

<section class="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
  <header class="border-b border-stone-200 px-5 py-5 dark:border-stone-700 sm:px-7">
    <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Preferencias</p>
    <h1 class="mt-1 text-2xl font-black tracking-tight text-stone-950 dark:text-white">Ajustes</h1>
    <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Personaliza cómo funciona y se muestra tu plan.</p>
  </header>

  <div class="divide-y divide-stone-200 dark:divide-stone-700">
    {#each settings as setting}
      <label class="flex cursor-pointer items-start justify-between gap-5 px-5 py-5 hover:bg-stone-50 dark:hover:bg-stone-800/70 sm:px-7">
        <span class="min-w-0">
          <span class="block text-base font-black text-stone-900 dark:text-white">{setting.label}</span>
          <span class="mt-1 block text-sm leading-relaxed text-stone-500 dark:text-stone-400">{setting.description}</span>
        </span>
        <input
          type="checkbox"
          aria-label={setting.label}
          class="mt-1 size-6 shrink-0 accent-orange-600"
          checked={setting.checked()}
          onchange={(event) => setting.update(event.currentTarget.checked)}
        />
      </label>
    {/each}
  </div>

  <footer class="border-t border-stone-200 bg-stone-50 px-5 py-5 dark:border-stone-700 dark:bg-stone-950/50 sm:px-7">
    <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Ayuda y soporte</p>
    <p class="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">Si encuentras un error o tienes algún problema, escríbenos a:</p>
    <a
      href="mailto:trabajo@diariodenutricion.com?subject=Problema%20con%20DG%20Nutrici%C3%B3n"
      class="mt-3 inline-flex min-h-11 max-w-full items-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-stone-700 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
    >
      <span class="truncate">trabajo@diariodenutricion.com</span>
    </a>
  </footer>
</section>
