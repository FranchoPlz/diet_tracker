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
    { id: 'shopping', label: 'Compra' },
    { id: 'settings', label: 'Ajustes' }
  ];
</script>

<nav
  class="sticky top-0 z-40 px-4 py-2 backdrop-blur sm:px-6 lg:px-8"
  style="background: color-mix(in srgb, var(--app-bg) 78%, transparent);"
  aria-label="Secciones de la aplicación"
>
  <div
    class="grid w-full grid-cols-5 gap-1 rounded-2xl p-0.5"
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
        style={active === tab.id ? '' : 'color: var(--text-muted); background: transparent;'}
      >
        <svg class="size-5 shrink-0 sm:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          {#if tab.id === 'home'}
            <path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" />
          {:else if tab.id === 'diet'}
            <path d="M7 3v8" /><path d="M4 3v5a3 3 0 0 0 6 0V3" /><path d="M7 11v10" /><path d="M17 3v18" /><path d="M17 3a4 4 0 0 1 0 8" />
          {:else if tab.id === 'training'}
            <path d="M6 7v10" /><path d="M18 7v10" /><path d="M3 9v6" /><path d="M21 9v6" /><path d="M6 12h12" />
          {:else if tab.id === 'shopping'}
            <path d="M3 3h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" />
          {:else}
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
          {/if}
        </svg>
        <span class="hidden truncate sm:inline">{tab.label}</span>
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
