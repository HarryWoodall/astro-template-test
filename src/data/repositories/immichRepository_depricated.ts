import { getErrorMsgFrom, ImageStoreError, sortImages, type GetImagesOptions } from '../imageStore';
import type { Image, GalleryImage, Collection } from '../galleryData';
import type { ImageInputFormat } from 'astro';
import type {
	SharedKeysResponse,
	AlbumCollectionResponse,
	AlbumResponse,
	Asset,
} from '../types/immichTypes';
import mime from 'mime-types';

type Album = {
	name: string;
	id: string;
	shareKey: string | undefined;
};

const apiKey = import.meta.env.PUBLIC_IMMICH_API_KEY;
const baseUrl = import.meta.env.PUBLIC_IMMICH_BASE_URL;
const albumPrefix = 'public_';

let albumResponses: AlbumResponse[] = [];

async function getFromApi<T>(slug: string) {
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

async function getAlbums(): Promise<Album[]> {
	const albums = await getFromApi<AlbumCollectionResponse>('/api/albums');
	return albums
		.filter((x) => x.albumName.includes(albumPrefix))
		.map((x) => {
			return {
				name: x.albumName.split(albumPrefix)[1],
				id: x.id,
				shareKey: undefined,
			};
		});
}

async function getAlbumAssets(albumId: string): Promise<Asset[]> {
	const albumData = await getFromApi<AlbumResponse>(`/api/albums/${albumId}`);
	albumResponses.push(albumData);
	return albumData.assets;
}

async function getAssetsFromAlbums(albums: Album[]): Promise<Asset[]> {
	const assets: Asset[] = [];
	for (const album of albums) {
		const albumAssets = await getAlbumAssets(album.id);

		assets.push(...albumAssets.map((x) => ({ ...x, shareKey: album.shareKey! })));
	}

	return assets;
}

function getAssetAlbums(asset: Asset) {
	return albumResponses
		.filter((x) => x.assets.some((a) => a.id === asset.id))
		.map((x) => x.albumName.split(albumPrefix)[1]);
}

async function mapShareKeys(albums: Album[]) {
	const keys = await getFromApi<SharedKeysResponse>('/api/shared-links');

	return albums.forEach((x) => {
		const key = keys.find((y) => y.album.id === x.id);

		if (!key) {
			throw new ImageStoreError(`album: ${x.name} does not have a valid shared link`);
		}

		x.shareKey = key.key;
	});
}

function filterDuplicateAssets(assets: Asset[]): Asset[] {
	const set = new Set();
	return assets.filter((item) => {
		if (set.has(item.id)) return false;
		set.add(item.id);
		return true;
	});
}

function filterAlbumsByCollection(collection: string | undefined, albums: Album[]): Album[] {
	if (collection) {
		albums = albums.filter((x) => x.name.toLocaleLowerCase() === collection.toLocaleLowerCase());
	}
	return albums;
}

const processImages = (images: GalleryImage[], assets: Asset[]): Image[] => {
	return images.reduce<Image[]>((acc, imageEntry, currentIndex) => {
		const imagePath = imageEntry.path;
		const currentAsset = assets[currentIndex];
		try {
			const image: Image = {
				src: {
					src: imagePath,
					thumbnail: imageEntry.thumbnail || imagePath,
					format: mime.extension(currentAsset.originalMimeType) as ImageInputFormat,
					height: currentAsset.exifInfo.exifImageHeight,
					width: currentAsset.exifInfo.exifImageWidth,
				}, // Assuming imagePath is a URL
				title: imageEntry.meta.title,
				description: imageEntry.meta.description,
				collections: imageEntry.meta.collections,
			};
			acc.push(image);
		} catch (error) {
			console.warn(`[WARN] ${getErrorMsgFrom(error)}`);
		}
		return acc;
	}, []);
};

export const getImages = async (options: GetImagesOptions = {}): Promise<Image[]> => {
	const { collection } = options;

	albumResponses = [];
	let albums = await getAlbums();
	albums = filterAlbumsByCollection(collection, albums);
	mapShareKeys(albums);

	try {
		let assets = await getAssetsFromAlbums(albums);
		assets = filterDuplicateAssets(assets);

		let images: GalleryImage[] = assets.map((x) => {
			return {
				path: `${baseUrl}/api/assets/${x.id}/thumbnail?size=fullsize&key=${x.shareKey}`,
				thumbnail: `${baseUrl}/api/assets/${x.id}/thumbnail?size=preview&key=${x.shareKey}`,
				meta: {
					title: x.exifInfo.description || '',
					description: x.exifInfo.description || '',
					collections: getAssetAlbums(x),
				},
			};
		});
		images = sortImages(images, options);
		return processImages(images, assets);
	} catch (error) {
		throw new ImageStoreError(`Failed to load images from cloudinary: ${getErrorMsgFrom(error)}`);
	}
};

export const getCollections = async (exclude: string[] = []): Promise<Collection[]> => {
	const albums = await getFromApi<AlbumCollectionResponse>('/api/albums');
	return albums
		.filter((x) => x.albumName.includes(albumPrefix))
		.filter(
			(x) =>
				!exclude.some((y) => x.albumName.split(albumPrefix)[1].toLowerCase() === y.toLowerCase()),
		)
		.map((x) => {
			return {
				name: x.albumName.split(albumPrefix)[1],
				id: x.albumName.split(albumPrefix)[1],
			};
		});
};
