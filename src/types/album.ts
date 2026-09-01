export type Album = {
  id: string;
  label: string;
  folder: string;
};

export type AlbumManifest = {
  version: number;
  roots: Album[];
  albums: Album[];
};
