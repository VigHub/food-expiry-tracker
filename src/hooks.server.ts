import { redirect, type Handle } from '@sveltejs/kit';
import { validateSession, isPasswordSet } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');
	const platform = event.platform;
	const url = event.url.pathname;

	// Check if user is authenticated via session cookie
	const isAuthenticated = sessionId ? await validateSession(sessionId, platform) : false;
	event.locals.authenticated = isAuthenticated;

	// Public endpoints that don't require authentication
	const isPublicRoute =
		url.startsWith('/login') ||
		url.startsWith('/api/auth/') ||
		url.endsWith('.png') ||
		url.endsWith('.jpg') ||
		url.endsWith('.svg') ||
		url.endsWith('.ico') ||
		url.endsWith('.webmanifest');

	// Check if password setup is completed
	const hasPassword = await isPasswordSet(platform);

	// If no password set yet and accessing app, allow landing on /login to perform setup
	if (!hasPassword) {
		if (!url.startsWith('/login') && !url.startsWith('/api/auth/')) {
			throw redirect(303, '/login');
		}
		return resolve(event);
	}

	// If route is protected and user is not authenticated
	if (!isPublicRoute && !isAuthenticated) {
		if (url.startsWith('/api/')) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		throw redirect(303, '/login');
	}

	// If user is already authenticated and visits /login, redirect to main page
	if (isAuthenticated && url === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
