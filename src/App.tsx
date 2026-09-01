import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import Gallery from "./components/Gallery/Gallery";
import albumManifest from "./data/albums.json";

import { usePhotos } from "./hooks/usePhotos";
import type { AlbumManifest } from "./types/album";

const FADE_DURATION_S = 0.2;
const albums = albumManifest as AlbumManifest;

const App = () => {
  const [photosFolderName, setPhotosFolderName] = useState<string | null>(null);
  const { photos, loading, loadingMore, hasMore, loadMore } = usePhotos(photosFolderName);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="app"
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: FADE_DURATION_S, ease: "easeOut" }}
    >
      <h1>La Otra Eternidad</h1>
      <div>
        <button onClick={() => setPhotosFolderName(null)} aria-pressed={photosFolderName === null}>
          Todas
        </button>
        {albums.roots.map((album) => (
          <button
            key={album.id}
            onClick={() => setPhotosFolderName(album.folder)}
            aria-pressed={photosFolderName === album.folder}
          >
            {album.label}
          </button>
        ))}
        {albums.albums.map((album) => (
          <button
            key={album.id}
            onClick={() => setPhotosFolderName(album.folder)}
            aria-pressed={photosFolderName === album.folder}
          >
            {album.label}
          </button>
        ))}
      </div>
      <Gallery
        galleryPhotos={photos}
        isLoadingMetadata={loading}
        isLoadingMore={loadingMore}
        hasMorePhotos={hasMore}
        onLoadMore={loadMore}
        photosFolderName={photosFolderName}
      />
    </motion.div>
  );
};

export default App;
