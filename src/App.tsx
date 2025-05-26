import { useState, useEffect } from 'react'
import './App.css'

import { Button } from "@/components/ui/button"

import Gallery from './Gallery';

import { usePhotoUrls } from './hooks/usePhotoUrls';

const App = () =>{

  const [photosFolderName, setPhotosFolderName] = useState<string | null>(null);
  const { filteredPhotoUrls, loading } = usePhotoUrls(photosFolderName);

  // Hacky, hacky
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    }
  }, [])

  if (loading) return <p>Cargando fotos...</p>

  return (
    <div className="text-3xl font-bold underline">
      <h1>Colección</h1>
      <div>
        <Button onClick={() => setPhotosFolderName(null)}>Todas</Button>
        <Button onClick={() => setPhotosFolderName('analog')}>Analógicas</Button>
        <Button onClick={() => setPhotosFolderName('digital')}>Digitales</Button>
      </div>
      <Gallery galleryPhotos={filteredPhotoUrls} />
    </div>
  )
};

export default App
