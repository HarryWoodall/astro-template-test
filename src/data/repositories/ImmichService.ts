import { getFromApi } from '../helpers/apiHelper';
import type {
	Album,
	AlbumCollectionResponse,
	AlbumResponse,
	Asset,
	SharedKeysResponse,
} from '../types/immichTypes';
import type { Collection, GalleryImage, Image } from '../galleryData';
import mime from 'mime-types';
import { getErrorMsgFrom, ImageStoreError, sortImages, type GetImagesOptions } from '../imageStore';
import type { ImageInputFormat } from 'astro';

export default class ImmichService {
	private albumPrefix = 'public_';
	private baseUrl = import.meta.env.PUBLIC_IMMICH_BASE_URL;
	private collection: string | undefined;

	private albumCollections: AlbumCollectionResponse = [];
	private shareKeys: SharedKeysResponse = [];
	private albumResponses: AlbumResponse[] = [];

	private albumsInCollection: Album[] = [];
	private assetsInCollection: Asset[] = [];

	constructor(collection: string | undefined) {
		this.collection = collection;
	}

	async preload() {
		await Promise.all([this.loadAlbumResponses(), this.loadShareKeys()]);

		const albums = this.getAlbums();
		this.albumsInCollection = this.filterAlbumsByCollection(this.collection, albums);
		this.mapShareKeys();

		await this.getAssetsInCollection();
		this.filterDuplicateAssets();
	}

	private async loadAlbumResponses() {
		this.albumCollections = await getFromApi<AlbumCollectionResponse>('/api/albums');
	}

	private async loadShareKeys() {
		this.shareKeys = await getFromApi<SharedKeysResponse>('/api/shared-links');
	}

	getImages(options: GetImagesOptions = {}): Image[] {
		try {
			let images: GalleryImage[] = this.assetsInCollection.map((x) => {
				return {
					path: `${this.baseUrl}/api/assets/${x.id}/thumbnail?size=fullsize&key=${x.shareKey}`,
					thumbnail: `${this.baseUrl}/api/assets/${x.id}/thumbnail?size=preview&key=${x.shareKey}`,
					meta: {
						title: x.exifInfo.description || '',
						description: x.exifInfo.description || '',
						collections: this.getAlbumsByAsset(x),
					},
				};
			});
			images = sortImages(images, options);
			return this.processImages(images, this.assetsInCollection);
		} catch (error) {
			throw new ImageStoreError(`Failed to load images from cloudinary: ${getErrorMsgFrom(error)}`);
		}
	}

	getCollections(exclude: string[] = []): Collection[] {
		return this.getAlbums()
			.filter((x) => !exclude.some((y) => x.name.toLowerCase() === y.toLowerCase()))
			.filter((x) => this.albumHasValidShareKey(x))
			.map((x) => {
				return {
					name: x.name,
					id: x.name,
				};
			});
	}

	private processImages(images: GalleryImage[], assets: Asset[]): Image[] {
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
	}

	private getAlbums(): Album[] {
		return this.albumCollections
			.filter((x) => x.albumName.includes(this.albumPrefix))
			.map((x) => {
				return {
					name: x.albumName.split(this.albumPrefix)[1],
					id: x.id,
					shareKey: undefined,
				};
			});
	}

	private async getAssetsInCollection(): Promise<void> {
		await Promise.all(
			this.albumsInCollection.map((x) => {
				return this.populateAlbumAssets(x);
			}),
		);
	}

	private getAlbumsByAsset(asset: Asset) {
		return this.albumResponses
			.filter((x) => x.assets.some((a) => a.id === asset.id))
			.map((x) => x.albumName.split(this.albumPrefix)[1]);
	}

	private async populateAlbumAssets(album: Album): Promise<void> {
		const albumData = await getFromApi<AlbumResponse>(`/api/albums/${album.id}`);
		this.albumResponses.push(albumData);

		this.assetsInCollection.push(
			...albumData.assets.map((x) => ({ ...x, shareKey: album.shareKey! })),
		);
	}

	private filterDuplicateAssets() {
		const set = new Set();
		this.assetsInCollection = this.assetsInCollection.filter((item) => {
			if (set.has(item.id)) return false;
			set.add(item.id);
			return true;
		});
	}

	private filterAlbumsByCollection(collection: string | undefined, albums: Album[]): Album[] {
		if (collection) {
			albums = albums.filter((x) => x.name.toLocaleLowerCase() === collection.toLocaleLowerCase());
		}
		return albums;
	}

	private albumHasValidShareKey(album: Album) {
		return this.shareKeys.find((y) => y.album.id === album.id);
	}

	private mapShareKeys() {
		this.albumsInCollection = this.albumsInCollection.filter((x) => this.albumHasValidShareKey(x));

		this.albumsInCollection.forEach((x) => {
			const key = this.shareKeys.find((y) => y.album.id === x.id);
			x.shareKey = key!.key;
		});
	}
}
