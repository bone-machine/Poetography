import { useEffect, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_URL;

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/images`)
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading images...</p>;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}
    >
      {images.map((url, idx) => (
        <img
          key={idx}
          src={url}
          style={{ width: '100%', borderRadius: '8px' }}
        />
      ))}
    </div>
  );
}

export default Gallery;