import { json, type RequestHandler } from '@sveltejs/kit';
import { isPasswordSet, setPassword, createSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	try {
		const { password } = await request.json();

		if (!password || typeof password !== 'string' || password.length < 4) {
			return json({ error: 'La password deve contenere almeno 4 caratteri' }, { status: 400 });
		}

		const hasPassword = await isPasswordSet(platform);
		if (hasPassword) {
			return json({ error: 'La password è già stata impostata' }, { status: 400 });
		}

		await setPassword(password, platform);

		// Log in automatically after setup
		const sessionId = await createSession(platform);
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 30 * 24 * 60 * 60
		});

		return json({ success: true });
	} catch (e) {
		console.error('Setup error:', e);
		return json({ error: 'Errore interno del server' }, { status: 500 });
	}
};
