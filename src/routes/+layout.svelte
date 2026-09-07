<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import { initializePreferences } from "$lib/preferences";
  import { appState } from "$lib/state.svelte";
  let { children } = $props();

  onMount(initializePreferences);
</script>

<div class="app-shell min-h-screen w-full min-w-0 overflow-x-clip" class:compact-view={appState.compactView}>
  {@render children()}
</div>
