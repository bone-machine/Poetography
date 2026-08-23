import { useState } from "react";
import "./App.css";

import Gallery from "../Gallery";

import { usePhotoUrls } from "../hooks/usePhotoUrls";

const App = () => {
  const [photosFolderName, setPhotosFolderName] = useState<string | null>(null);
  const { filteredPhotoUrls, loading } = usePhotoUrls(photosFolderName);

  if (loading) return <p>Cargando fotos...</p>;

  return (
    <div className="text-3xl font-bold underline">
      <h1>Colección</h1>
      <div>
        <button onClick={() => setPhotosFolderName(null)}>Todas</button>
        <button onClick={() => setPhotosFolderName("analog")}>Analógicas</button>
        <button onClick={() => setPhotosFolderName("digital")}>Digitales</button>
      </div>
      <Gallery galleryPhotos={filteredPhotoUrls} />
    </div>
  );
};

export default App;
