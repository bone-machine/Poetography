const Gallery = ({ galleryPhotos }: { galleryPhotos: string[] }) => (
  <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
      {galleryPhotos.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`Photo ${i + 1}`}
          style={{ width: 150, height: 150, objectFit: 'cover' }}
        />
      ))}
    </div>
  </div>
);

export default Gallery;