<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Smart Fridge - Expiry Tracker</title>
</svelte:head>

<div class="app-container">
	{@render children()}
</div>
