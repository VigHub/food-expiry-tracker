<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import '../app.css';

	let { children } = $props();
	let isLoggingOut = $state(false);

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			goto('/login');
		} catch (e) {
			console.error('Logout error:', e);
		} finally {
			isLoggingOut = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Smart Fridge - Expiry Tracker</title>
</svelte:head>

<div class="app-container">
	{#if page.url.pathname !== '/login'}
		<div class="top-nav">
			<div class="nav-brand">
				<span class="nav-logo">🥗</span>
				<span class="nav-title">Smart Fridge</span>
				<span class="nav-badge">Cloudflare D1</span>
			</div>
			<button class="btn-logout" onclick={handleLogout} disabled={isLoggingOut}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
					<polyline points="16 17 21 12 16 7"></polyline>
					<line x1="21" y1="12" x2="9" y2="12"></line>
				</svg>
				Esci
			</button>
		</div>
	{/if}

	{@render children()}
</div>

<style>
	.top-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		background: rgba(15, 23, 42, 0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-logo {
		font-size: 1.2rem;
	}

	.nav-title {
		font-weight: 700;
		font-size: 1rem;
		color: #f8fafc;
	}

	.nav-badge {
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
		background: rgba(99, 102, 241, 0.15);
		color: #818cf8;
		border: 1px solid rgba(99, 102, 241, 0.3);
	}

	.btn-logout {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #cbd5e1;
		padding: 0.4rem 0.8rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-logout svg {
		width: 1rem;
		height: 1rem;
	}

	.btn-logout:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.3);
		color: #fca5a5;
	}
</style>
