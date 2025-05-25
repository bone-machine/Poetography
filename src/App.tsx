import { useState, useEffect } from 'react'
import './App.css'

import Gallery from './Gallery';

import { Button } from "@/components/ui/button"

import { fetchPhotos } from './utils/fetchPhotos';

const App = () =>{

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [filteredPhotoUrls, setFilteredPhotoUrls] = useState<string[]>([]);
  const [photosFormat, setPhotosFormat] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hacky, hacky
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    }
  }, [])

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const data = await fetchPhotos();
        setPhotoUrls(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPhotos();
  }, []);

   useEffect(() => {
    if (photosFormat !== null) {
      const filteredPhotoUrls = photoUrls.filter(url => url.includes(`/${photosFormat}/`));
      setFilteredPhotoUrls(filteredPhotoUrls);
      return;
    }
    setFilteredPhotoUrls(photoUrls);
  }, [photoUrls, photosFormat]);

  if (loading) return <p>Cargando fotos...</p>

  return (
    <div className="text-3xl font-bold underline">
      <h1>Colección</h1>
      <div>
        <Button onClick={() => setPhotosFormat(null)}>Todas</Button>
        <Button onClick={() => setPhotosFormat('analog')}>Analógicas</Button>
        <Button onClick={() => setPhotosFormat('digital')}>Digitales</Button>
      </div>
      <Gallery galleryPhotos={filteredPhotoUrls} />
    </div>
  )
};

export default App
