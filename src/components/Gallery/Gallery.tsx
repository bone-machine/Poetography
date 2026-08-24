import styles from "./Gallery.module.css";

const Gallery = ({ galleryPhotos }: { galleryPhotos: string[] }) => (
  <div className={styles.gallery}>
    {galleryPhotos.map((url, i) => (
      <img key={i} src={url} alt={`Photo ${i + 1}`} />
    ))}
  </div>
);

export default Gallery;
