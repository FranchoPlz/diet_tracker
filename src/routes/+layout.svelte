<script lang="ts">
  import "../app.css";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import ListLibrary from "$lib/components/ListLibrary.svelte";
  import PlanLibrary from "$lib/components/PlanLibrary.svelte";
  import SettingsMenu from "$lib/components/SettingsMenu.svelte";
  import { appState } from "$lib/state.svelte";
  let { children } = $props();
</script>

<div class="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 text-stone-900 dark:text-stone-100" class:compact-view={appState.compactView}>
  <header class="p-4 flex justify-end gap-2 items-center max-w-[1480px] mx-auto w-full">
    <PlanLibrary />
    <ListLibrary />
    <SettingsMenu />
    <ThemeToggle />
  </header>
  {@render children()}
</div>
