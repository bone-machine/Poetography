export type Album = {
  id: string;
  label: string;
  folder: string;
};

export type Photo = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

export type PhotoAlbum = {
  id: string;
  label: string;
  folder: string;
  photos: Photo[];
};

export type AlbumManifest = {
  version: number;
  roots: Album[];
  albums: Album[];
  /** Photos for the unfiltered "All" view, ordered by public_id. */
  allPhotos: Photo[];
  /** Ordered photos per folder, including root folders and nested albums. */
  photosByFolder: Record<string, Photo[]>;
};
