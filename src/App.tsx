import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import Gallery from "./components/Gallery/Gallery";

import { usePhotos } from "./hooks/usePhotos";

const FADE_DURATION_S = 0.2;

const App = () => {
  const [photosFolderName, setPhotosFolderName] = useState<string | null>(null);
  const { filteredPhotos, loading } = usePhotos(photosFolderName);
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
        <button onClick={() => setPhotosFolderName(null)}>Todas</button>
        <button onClick={() => setPhotosFolderName("analog")}>Analógicas</button>
        <button onClick={() => setPhotosFolderName("digital")}>Digitales</button>
      </div>
      <Gallery galleryPhotos={filteredPhotos} isLoadingMetadata={loading} />
    </motion.div>
  );
};

export default App;
