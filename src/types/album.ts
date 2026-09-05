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
  /**
   * Photos organized by leaf folder path only.
   * No parent-child duplication — each photo appears exactly once.
   * "Todas" (All) view: Object.values(photosByFolder).flat()
   * Root folder view: filter by prefix (e.g., folder.startsWith('analog/'))
   * Specific album: direct lookup
   */
  photosByFolder: Record<string, Photo[]>;
};
