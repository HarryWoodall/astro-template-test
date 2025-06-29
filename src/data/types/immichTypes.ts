export type AlbumCollectionResponse = Array<{
	albumName: string;
	description: string;
	albumThumbnailAssetId: string;
	createdAt: string;
	updatedAt: string;
	id: string;
	ownerId: string;
	owner: {
		id: string;
		email: string;
		name: string;
		profileImagePath: string;
		avatarColor: string;
		profileChangedAt: string;
	};
	albumUsers: Array<any>;
	shared: boolean;
	hasSharedLink: boolean;
	startDate: string;
	endDate: string;
	assets: Array<any>;
	assetCount: number;
	isActivityEnabled: boolean;
	order: string;
	lastModifiedAssetTimestamp: string;
}>;

export type AlbumResponse = {
	albumName: string;
	description: string;
	albumThumbnailAssetId: string;
	createdAt: string;
	updatedAt: string;
	id: string;
	ownerId: string;
	owner: {
		id: string;
		email: string;
		name: string;
		profileImagePath: string;
		avatarColor: string;
		profileChangedAt: string;
	};
	albumUsers: Array<any>;
	shared: boolean;
	hasSharedLink: boolean;
	startDate: string;
	endDate: string;
	assets: Asset[];
	assetCount: number;
	isActivityEnabled: boolean;
	order: string;
	lastModifiedAssetTimestamp: string;
};

export interface Asset {
	id: string;
	deviceAssetId: string;
	ownerId: string;
	deviceId: string;
	libraryId: any;
	type: string;
	originalPath: string;
	originalFileName: string;
	originalMimeType: string;
	thumbhash: string;
	fileCreatedAt: string;
	fileModifiedAt: string;
	localDateTime: string;
	updatedAt: string;
	isFavorite: boolean;
	isArchived: boolean;
	isTrashed: boolean;
	duration: string;
	exifInfo: ExifInfo;
	livePhotoVideoId: any;
	people: any[];
	checksum: string;
	isOffline: boolean;
	hasMetadata: boolean;
	duplicateId: any;
	resized: boolean;
	shareKey: string;
}

export interface ExifInfo {
	make: any;
	model: any;
	exifImageWidth: number;
	exifImageHeight: number;
	fileSizeInByte: number;
	orientation: string;
	dateTimeOriginal: string;
	modifyDate: string;
	timeZone: any;
	lensModel: any;
	fNumber: any;
	focalLength: any;
	iso: any;
	exposureTime: any;
	latitude: any;
	longitude: any;
	city: any;
	state: any;
	country: any;
	description: string;
	projectionType: any;
	rating: any;
}

export type SharedKeysResponse = Array<{
	id: string;
	description: any;
	password: string;
	userId: string;
	key: string;
	type: string;
	createdAt: string;
	expiresAt: any;
	assets: Array<any>;
	album: {
		albumName: string;
		description: string;
		albumThumbnailAssetId: string;
		createdAt: string;
		updatedAt: string;
		id: string;
		ownerId: string;
		owner: {
			id: string;
			email: string;
			name: string;
			profileImagePath: string;
			avatarColor: string;
			profileChangedAt: string;
		};
		albumUsers: Array<any>;
		shared: boolean;
		hasSharedLink: boolean;
		assets: Array<any>;
		assetCount: number;
		isActivityEnabled: boolean;
		order: string;
	};
	allowUpload: boolean;
	allowDownload: boolean;
	showMetadata: boolean;
}>;

export type Album = {
	name: string;
	id: string;
	shareKey: string | undefined;
};
