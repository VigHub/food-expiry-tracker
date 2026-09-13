import { json, type RequestHandler } from '@sveltejs/kit';
import { isPasswordSet } from '$lib/server/auth';

export const GET: RequestHandler = async ({ platform, locals }) => {
	const hasPassword = await isPasswordSet(platform);
	return json({
		hasPassword,
		authenticated: locals.authenticated
	});
};
