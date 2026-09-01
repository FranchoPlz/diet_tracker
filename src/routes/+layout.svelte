<script lang="ts">
  import "../app.css";
  import FloatingPreferences from "$lib/components/FloatingPreferences.svelte";
  import { appState } from "$lib/state.svelte";
  let { children } = $props();
</script>

<div class="app-shell min-h-screen w-full min-w-0 overflow-x-clip" class:compact-view={appState.compactView}>
  {@render children()}
  <FloatingPreferences />
</div>
