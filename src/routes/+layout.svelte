<script lang="ts">
  import "../app.css";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import ListLibrary from "$lib/components/ListLibrary.svelte";
  import PlanLibrary from "$lib/components/PlanLibrary.svelte";
  import SettingsMenu from "$lib/components/SettingsMenu.svelte";
  import { appState } from "$lib/state.svelte";
  let { children } = $props();
</script>

<div class="min-h-screen w-full min-w-0 overflow-x-clip bg-[#f7f4ee] text-stone-900 dark:bg-stone-950 dark:text-stone-100" class:compact-view={appState.compactView}>
  <header class="mx-auto flex w-full max-w-[1480px] flex-wrap items-center justify-end gap-2 p-4">
    <PlanLibrary />
    <ListLibrary />
    <SettingsMenu />
    <ThemeToggle />
  </header>
  {@render children()}
</div>
