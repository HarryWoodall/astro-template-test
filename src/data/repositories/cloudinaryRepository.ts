import {
	filterImagesByCollection,
	getErrorMsgFrom,
	ImageStoreError,
	sortImages,
	type GetImagesOptions,
	type ImageListResponse,
} from '../imageStore';
import type { Image, GalleryImage } from '../galleryData';
import { Cloudinary } from '@cloudinary/url-gen';
import type { ImageInputFormat } from 'astro';

const cloudinary = new Cloudinary({ cloud: { cloudName: 'doeqxv34z' } });

export const getImages = async (options: GetImagesOptions = {}): Promise<Image[]> => {
	const { collection } = options;

	const imageDataRes = await fetch('https://res.cloudinary.com/doeqxv34z/any/list/public.json');
	const imageData = (await imageDataRes.json()) as ImageListResponse;

	try {
		let images: GalleryImage[] = imageData.resources.map((x) => {
			return {
				path:
					x.resource_type === 'image'
						? cloudinary.image(x.public_id).toURL()
						: cloudinary.video(x.public_id).toURL(),
				meta: {
					title: x.context?.custom?.caption || '',
					description: x.context?.custom?.alt || '',
					collections: x?.asset_folder ? [x?.asset_folder] : [],
				},
			};
		});
		images = filterImagesByCollection(collection, images);
		images = sortImages(images, options);
		return processImages(images, imageData);
	} catch (error) {
		throw new ImageStoreError(`Failed to load images from cloudinary: ${getErrorMsgFrom(error)}`);
	}
};

const processImages = (images: GalleryImage[], imageData: ImageListResponse): Image[] => {
	return images.reduce<Image[]>((acc, imageEntry, currentIndex) => {
		const imagePath = imageEntry.path;
		const currentImageData = imageData.resources[currentIndex];
		try {
			const image: Image = {
				src: {
					src: imagePath,
					format: currentImageData.format as ImageInputFormat,
					height: currentImageData.height,
					width: currentImageData.width,
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
