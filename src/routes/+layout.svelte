<script lang="ts">
  import "../app.css";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  let { children } = $props();
</script>

<div class="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
  <header class="p-4 flex justify-end items-center max-w-[1480px] mx-auto w-full">
    <ThemeToggle />
  </header>
  {@render children()}
</div>
