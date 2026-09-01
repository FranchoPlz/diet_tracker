<script lang="ts">
  import "../app.css";
  import FloatingPreferences from "$lib/components/FloatingPreferences.svelte";
  import { appState } from "$lib/state.svelte";
  let { children } = $props();
</script>

<div class="min-h-screen w-full min-w-0 overflow-x-clip bg-[#f7f4ee] text-stone-900 dark:bg-stone-950 dark:text-stone-100" class:compact-view={appState.compactView}>
  {@render children()}
  <FloatingPreferences />
</div>
