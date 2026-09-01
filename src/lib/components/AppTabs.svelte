<script module lang="ts">
  export type AppTab = 'home' | 'diet' | 'training' | 'shopping';
</script>

<script lang="ts">
  let {
    active,
    onChange,
    shoppingCount
  }: {
    active: AppTab;
    onChange: (tab: AppTab) => void;
    shoppingCount?: number;
  } = $props();

  const tabs: { id: AppTab; label: string }[] = [
    { id: 'home', label: 'Inicio' },
    { id: 'diet', label: 'Dieta' },
    { id: 'training', label: 'Ejercicios' },
    { id: 'shopping', label: 'Compra' }
  ];
</script>

<nav
  class="sticky top-0 z-40 border-b border-stone-200 bg-[#f7f4ee]/95 p-2 backdrop-blur dark:border-stone-700 dark:bg-stone-950/95"
  aria-label="Secciones de la aplicación"
>
  <div
    class="mx-auto grid w-full max-w-xl grid-cols-4 gap-1 rounded-2xl bg-stone-200/80 p-1 shadow-sm dark:bg-stone-800"
    role="tablist"
  >
    {#each tabs as tab}
      <button
        type="button"
        role="tab"
        aria-selected={active === tab.id}
        aria-label={tab.label}
        tabindex={active === tab.id ? 0 : -1}
        onclick={() => onChange(tab.id)}
        class="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 {active === tab.id
          ? 'bg-teal-700 text-white shadow-sm'
          : 'text-stone-600 hover:bg-white/70 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white'}"
      >
        <span>{tab.label}</span>
        {#if tab.id === 'shopping' && shoppingCount !== undefined}
          <span
            class="min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none {active === 'shopping'
              ? 'bg-orange-500 text-white'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'}"
            aria-hidden="true"
          >{shoppingCount}</span>
        {/if}
      </button>
    {/each}
  </div>
</nav>
