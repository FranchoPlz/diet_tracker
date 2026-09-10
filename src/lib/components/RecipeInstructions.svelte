<script lang="ts">
  let { text } = $props<{ text: string }>();
</script>

<details class="group overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/25">
  <summary class="flex min-h-12 cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-orange-500 sm:px-4 [&::-webkit-details-marker]:hidden">
    <span aria-hidden="true" class="grid size-8 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300">
      <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 11v5"></path>
        <path d="M12 8h.01"></path>
      </svg>
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-black text-stone-800 dark:text-stone-100">Cómo prepararlo</span>
      <span class="block text-xs text-stone-500 dark:text-stone-400">Ver instrucciones de la receta</span>
    </span>
    <span aria-hidden="true" class="shrink-0 text-lg font-black text-orange-600 transition-transform group-open:rotate-180 dark:text-orange-400">⌄</span>
  </summary>
  <div class="border-t border-orange-200 px-4 py-4 dark:border-orange-900 sm:px-5">
    <p class="whitespace-pre-line break-words text-[15px] leading-7 text-stone-700 dark:text-stone-200">{text}</p>
  </div>
</details>
