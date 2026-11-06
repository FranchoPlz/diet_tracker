<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  let { labelledby, wide = false, onClose, children }: {
    labelledby: string;
    wide?: boolean;
    onClose: () => void;
    children: Snippet;
  } = $props();

  onMount(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
  role="presentation"
  onclick={(event) => { if (event.target === event.currentTarget) onClose(); }}
>
  <dialog
    open
    class="app-surface m-0 max-h-[calc(100dvh-env(safe-area-inset-top)-0.5rem)] w-full max-w-none overflow-y-auto rounded-t-3xl border px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 text-inherit shadow-2xl sm:m-auto sm:rounded-3xl sm:p-6 {wide ? 'sm:max-w-2xl' : 'sm:max-w-xl'}"
    aria-labelledby={labelledby}
  >
    <div class="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-600 sm:hidden"></div>
    {@render children()}
  </dialog>
</div>
