<script module lang="ts">
  export type { AppTab } from '$lib/types';
</script>

<script lang="ts">
  import type { AppTab } from '$lib/types';
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
  class="sticky top-0 z-40 border-b py-2 backdrop-blur"
  style="border-color: var(--border); background: color-mix(in srgb, var(--app-bg) 88%, transparent);"
  aria-label="Secciones de la aplicación"
>
  <div
    class="mx-auto grid w-full max-w-xl grid-cols-4 gap-1 rounded-2xl border p-1 shadow-sm"
    style="border-color: var(--border); background: var(--surface);"
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
        class="flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-black transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-sm {active === tab.id
          ? 'app-accent-button shadow-sm'
          : 'hover:opacity-90'}"
        style={active === tab.id ? '' : 'color: var(--text-muted); background: color-mix(in srgb, var(--surface-strong) 72%, transparent);'}
      >
        <span class="truncate">{tab.label}</span>
        {#if tab.id === 'shopping' && shoppingCount !== undefined}
          <span
            class="min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-none {active === 'shopping'
              ? 'bg-orange-500 text-white'
              : 'text-orange-300'}"
            style={active === 'shopping' ? '' : 'background: var(--warm-soft);'}
            aria-hidden="true"
          >{shoppingCount}</span>
        {/if}
      </button>
    {/each}
  </div>
</nav>
