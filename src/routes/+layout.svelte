<script lang="ts">
  import "../app.css";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  let { children } = $props();
</script>

<div class="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
  <header class="p-4 flex justify-end items-center max-w-6xl mx-auto w-full">
    <ThemeToggle />
  </header>
  {@render children()}
</div>
