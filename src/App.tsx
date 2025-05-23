import { useState, useEffect } from 'react'
import './App.css'

import { Button } from "@/components/ui/button"

import Gallery from './Gallery';

import { fetchPhotos } from './utils/fetchPhotos';

const App = () =>{

  const [photoFormat, setPhotoFormat] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.classList.add("dark")

    return () => {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const data = await fetchPhotos(photoFormat || undefined);
        setPhotoUrls(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPhotos();
  }, [photoFormat]);

  if (loading) return <p>Cargando fotos...</p>

  return (
    <div className="text-3xl font-bold underline">
      <h1>Colección</h1>
      <div>
        <Button onClick={() => setPhotoFormat(null)}>Todas</Button>
        <Button onClick={() => setPhotoFormat('analog')}>Analógicas</Button>
        <Button onClick={() => setPhotoFormat('digital')}>Digitales</Button>
      </div>
      
      <Gallery galleryPhotos={photoUrls} />
    </div>
  )
};

export default App
