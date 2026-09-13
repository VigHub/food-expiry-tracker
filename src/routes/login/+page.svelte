<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let isChecking = $state(true);
	let hasPasswordSet = $state(true);
	let errorMessage = $state('');
	let successMessage = $state('');

	onMount(async () => {
		try {
			const res = await fetch('/api/auth/status');
			if (res.ok) {
				const data = await res.json();
				hasPasswordSet = data.hasPassword;
				if (data.authenticated) {
					goto('/');
				}
			}
		} catch (e) {
			console.error('Failed to check auth status:', e);
		} finally {
			isChecking = false;
		}
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		if (!password) return;

		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			const data = await res.json();

			if (res.ok && data.success) {
				successMessage = 'Accesso effettuato!';
				setTimeout(() => goto('/'), 400);
			} else {
				errorMessage = data.error || 'Password non valida. Riprova.';
			}
		} catch (e) {
			errorMessage = 'Errore di connessione al server.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSetup(e: SubmitEvent) {
		e.preventDefault();
		if (!password) return;

		if (password.length < 4) {
			errorMessage = 'La password deve contenere almeno 4 caratteri.';
			return;
		}

		if (password !== confirmPassword) {
			errorMessage = 'Le password non coincidono.';
			return;
		}

		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/auth/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});

			const data = await res.json();

			if (res.ok && data.success) {
				successMessage = 'Password configurata con successo!';
				setTimeout(() => goto('/'), 400);
			} else {
				errorMessage = data.error || 'Errore durante la configurazione.';
			}
		} catch (e) {
			errorMessage = 'Errore di connessione durante la configurazione.';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{hasPasswordSet ? 'Accedi' : 'Configura Accesso'} - Food Expiry Tracker</title>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		<div class="brand">
			<div class="icon-glow">
				<span class="icon">🥗</span>
			</div>
			<h1>Food Expiry Tracker</h1>
			<p class="subtitle">
				{#if isChecking}
					Caricamento in corso...
				{:else if hasPasswordSet}
					Inserisci la password per accedere alla dispensa online
				{:else}
					Configura la tua password di accesso per iniziare
				{/if}
			</p>
		</div>

		{#if isChecking}
			<div class="loading-spinner-wrapper">
				<div class="spinner"></div>
			</div>
		{:else if !hasPasswordSet}
			<!-- INITIAL SETUP FORM -->
			<form onsubmit={handleSetup} class="auth-form">
				<div class="setup-badge">⚡ Primo Avvio Cloudflare</div>

				{#if errorMessage}
					<div class="alert alert-error">
						⚠️ {errorMessage}
					</div>
				{/if}

				{#if successMessage}
					<div class="alert alert-success">
						✅ {successMessage}
					</div>
				{/if}

				<div class="form-group">
					<label for="setup-password">Nuova Password</label>
					<div class="input-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							id="setup-password"
							bind:value={password}
							placeholder="Almeno 4 caratteri"
							required
							minlength="4"
							disabled={isLoading}
						/>
						<button
							type="button"
							class="btn-toggle-pass"
							onclick={() => (showPassword = !showPassword)}
						>
							{showPassword ? '🙈' : '👁️'}
						</button>
					</div>
				</div>

				<div class="form-group">
					<label for="confirm-password">Conferma Password</label>
					<input
						type={showPassword ? 'text' : 'password'}
						id="confirm-password"
						bind:value={confirmPassword}
						placeholder="Ripeti password"
						required
						disabled={isLoading}
					/>
				</div>

				<button type="submit" class="btn-primary" disabled={isLoading}>
					{#if isLoading}
						<span class="btn-spinner"></span> Salvataggio in corso...
					{:else}
						🔒 Imposta Password & Accedi
					{/if}
				</button>
			</form>
		{:else}
			<!-- LOGIN FORM -->
			<form onsubmit={handleLogin} class="auth-form">
				{#if errorMessage}
					<div class="alert alert-error">
						⚠️ {errorMessage}
					</div>
				{/if}

				{#if successMessage}
					<div class="alert alert-success">
						✅ {successMessage}
					</div>
				{/if}

				<div class="form-group">
					<label for="login-password">Password</label>
					<div class="input-wrapper">
						<input
							type={showPassword ? 'text' : 'password'}
							id="login-password"
							bind:value={password}
							placeholder="La tua password"
							required
							disabled={isLoading}
							autocomplete="current-password"
						/>
						<button
							type="button"
							class="btn-toggle-pass"
							onclick={() => (showPassword = !showPassword)}
						>
							{showPassword ? '🙈' : '👁️'}
						</button>
					</div>
				</div>

				<button type="submit" class="btn-primary" disabled={isLoading}>
					{#if isLoading}
						<span class="btn-spinner"></span> Verifica in corso...
					{:else}
						🔑 Accedi alla Dispensa
					{/if}
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 40%),
			radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.15), transparent 40%),
			#0f172a;
		color: #f8fafc;
		font-family: inherit;
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
		background: rgba(30, 41, 59, 0.7);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		padding: 2.5rem 2rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.brand {
		text-align: center;
		margin-bottom: 2rem;
	}

	.icon-glow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		border-radius: 1.25rem;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3));
		border: 1px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
		margin-bottom: 1rem;
	}

	.icon {
		font-size: 2.5rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #818cf8, #c084fc);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		font-size: 0.9rem;
		color: #94a3b8;
		line-height: 1.4;
	}

	.setup-badge {
		background: rgba(99, 102, 241, 0.15);
		color: #a5b4fc;
		border: 1px solid rgba(99, 102, 241, 0.3);
		padding: 0.4rem 0.8rem;
		border-radius: 2rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #cbd5e1;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	input {
		width: 100%;
		padding: 0.8rem 1rem;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.75rem;
		color: #f8fafc;
		font-size: 0.95rem;
		outline: none;
		transition: all 0.2s ease;
	}

	input:focus {
		border-color: #818cf8;
		box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
	}

	.btn-toggle-pass {
		position: absolute;
		right: 0.5rem;
		background: none;
		border: none;
		padding: 0.4rem 0.6rem;
		cursor: pointer;
		font-size: 1.1rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.btn-toggle-pass:hover {
		opacity: 1;
	}

	.btn-primary {
		width: 100%;
		padding: 0.9rem;
		border: none;
		border-radius: 0.75rem;
		background: linear-gradient(135deg, #6366f1, #a855f7);
		color: #ffffff;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
		transition: all 0.2s ease;
		margin-top: 0.5rem;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.95;
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.alert-error {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
	}

	.alert-success {
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: #86efac;
	}

	.loading-spinner-wrapper {
		display: flex;
		justify-content: center;
		padding: 2rem;
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: #818cf8;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.btn-spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
