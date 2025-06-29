import { ImageStoreError } from '../imageStore';

export async function getFromApi<T>(slug: string) {
	const apiKey = import.meta.env.PUBLIC_IMMICH_API_KEY;
	const baseUrl = import.meta.env.PUBLIC_IMMICH_BASE_URL;

	const res = await fetch(`${baseUrl}${slug}`, {
		headers: {
			'x-api-key': apiKey,
		},
	});

	if (!res.ok) {
		console.log(`Fetching from ${baseUrl}${slug}`);
		throw new ImageStoreError(`Failed to fetch from API: ${res.status} ${res.statusText}`);
	}

	return res.json() as Promise<T>;
}
