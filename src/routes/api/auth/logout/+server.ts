import { json, type RequestHandler } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const sessionId = cookies.get('session');
	if (sessionId) {
		await destroySession(sessionId, platform);
		cookies.delete('session', { path: '/' });
	}
	return json({ success: true });
};
