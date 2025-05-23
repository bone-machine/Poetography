import { useState, useEffect } from 'react'
import './App.css'

import Gallery from './Gallery';

import { fetchPhotos } from './utils/fetchPhotos';

const App = () =>{

  const [photoFormat, setPhotoFormat] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    <div>
      <h1>Colección</h1>
      <div>
        <button onClick={() => setPhotoFormat(null)}>Todas</button>
        <button onClick={() => setPhotoFormat('analog')}>Analógicas</button>
        <button onClick={() => setPhotoFormat('digital')}>Digitales</button>
      </div>
      
      <Gallery galleryPhotos={photoUrls} />
    </div>
  )
};

export default App
