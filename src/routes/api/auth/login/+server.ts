import { json, type RequestHandler } from '@sveltejs/kit';
import { authenticatePassword, createSession, isPasswordSet } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	try {
		const { password } = await request.json();

		if (!password || typeof password !== 'string') {
			return json({ error: 'Password required' }, { status: 400 });
		}

		const hasPassword = await isPasswordSet(platform);
		if (!hasPassword) {
			return json({ error: 'System not set up yet. Please complete setup first.' }, { status: 400 });
		}

		const isValid = await authenticatePassword(password, platform);
		if (!isValid) {
			return json({ error: 'Password errata' }, { status: 401 });
		}

		const sessionId = await createSession(platform);

		// Set HTTP-only secure session cookie for 30 days
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 30 * 24 * 60 * 60
		});

		return json({ success: true });
	} catch (e) {
		console.error('Login error:', e);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
