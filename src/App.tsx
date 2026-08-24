import { useState } from "react";

import Gallery from "./components/Gallery/Gallery";

import { usePhotoUrls } from "./hooks/usePhotoUrls";

const App = () => {
  const [photosFolderName, setPhotosFolderName] = useState<string | null>(null);
  const { filteredPhotoUrls, loading } = usePhotoUrls(photosFolderName);

  if (loading) return <p>Cargando fotos...</p>;

  return (
    <div className="app">
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
