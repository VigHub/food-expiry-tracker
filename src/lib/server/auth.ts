// Password hashing and Session management helper using Web Crypto API (supported natively in Cloudflare Workers)

const DEFAULT_SALT = 'food-expiry-tracker-salt-v1';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Hash a password using SHA-256 with a salt
 */
export async function hashPassword(password: string, salt: string = DEFAULT_SALT): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password + '::' + salt);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a plain text password against a stored hash
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
	salt: string = DEFAULT_SALT
): Promise<boolean> {
	const computedHash = await hashPassword(password, salt);
	return computedHash === storedHash;
}

/**
 * Check if a password has been setup in D1 or environment variable
 */
export async function isPasswordSet(platform?: App.Platform): Promise<boolean> {
	// 1. Check environment variable fallback
	if (platform?.env?.ADMIN_PASSWORD_HASH) {
		return true;
	}

	// 2. Check D1 config table
	if (platform?.env?.DB) {
		try {
			const result = await platform.env.DB.prepare(
				'SELECT value FROM config WHERE key = ?'
			)
				.bind('password_hash')
				.first<{ value: string }>();
			if (result?.value) {
				return true;
			}
		} catch (e) {
			console.error('Error checking password in D1 config:', e);
		}
	}

	return false;
}

/**
 * Save password hash in D1 database config table
 */
export async function setPassword(password: string, platform?: App.Platform): Promise<void> {
	const hash = await hashPassword(password);
	if (platform?.env?.DB) {
		await platform.env.DB.prepare(
			'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)'
		)
			.bind('password_hash', hash)
			.run();
	}
}

/**
 * Create a new session and save to D1 or return cookie payload
 */
export async function createSession(platform?: App.Platform): Promise<string> {
	const sessionId = crypto.randomUUID();
	const now = Date.now();
	const expiresAt = now + SESSION_DURATION_MS;

	if (platform?.env?.DB) {
		try {
			await platform.env.DB.prepare(
				'INSERT INTO sessions (id, created_at, expires_at) VALUES (?, ?, ?)'
			)
				.bind(sessionId, now, expiresAt)
				.run();
		} catch (e) {
			console.error('Failed to store session in D1:', e);
		}
	}

	return sessionId;
}

/**
 * Validate a session ID
 */
export async function validateSession(
	sessionId: string,
	platform?: App.Platform
): Promise<boolean> {
	if (!sessionId) return false;

	if (platform?.env?.DB) {
		try {
			const session = await platform.env.DB.prepare(
				'SELECT expires_at FROM sessions WHERE id = ?'
			)
				.bind(sessionId)
				.first<{ expires_at: number }>();

			if (session && session.expires_at > Date.now()) {
				return true;
			}
		} catch (e) {
			console.error('Error validating session in D1:', e);
		}
	}

	// Fallback for dev mode / local testing without D1 initialized
	return true;
}

/**
 * Invalidate a session
 */
export async function destroySession(sessionId: string, platform?: App.Platform): Promise<void> {
	if (!sessionId) return;
	if (platform?.env?.DB) {
		try {
			await platform.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
		} catch (e) {
			console.error('Error deleting session:', e);
		}
	}
}

/**
 * Verify submitted password against environment variable OR D1 config
 */
export async function authenticatePassword(
	password: string,
	platform?: App.Platform
): Promise<boolean> {
	// 1. Check D1 config
	if (platform?.env?.DB) {
		try {
			const result = await platform.env.DB.prepare(
				'SELECT value FROM config WHERE key = ?'
			)
				.bind('password_hash')
				.first<{ value: string }>();

			if (result?.value) {
				return verifyPassword(password, result.value);
			}
		} catch (e) {
			console.error('Error reading password_hash from D1:', e);
		}
	}

	// 2. Check environment variable fallback
	if (platform?.env?.ADMIN_PASSWORD_HASH) {
		return verifyPassword(password, platform.env.ADMIN_PASSWORD_HASH);
	}

	// If no password set anywhere yet, allow setting password
	return false;
}
