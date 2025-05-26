import { useEffect, useState } from "react";
import { fetchPhotos } from "../utils/fetchPhotos";

export function usePhotoUrls(photosFolderName: string | null) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [filteredPhotoUrls, setFilteredPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const CACHE_KEY = 'photoUrlsCache';
    const TTL_MS = 1000 * 60 * 30;  // 30 minutes

    const loadPhotos = async () => {
      try {
        const cachedPhotoUrls = localStorage.getItem(CACHE_KEY);
        if (cachedPhotoUrls) {
          const { timestamp, data } = JSON.parse(cachedPhotoUrls);
          const isCacheFresh = Date.now() - timestamp < TTL_MS;
          if (isCacheFresh) {
            setPhotoUrls(data);
            setLoading(false);
            return;
          }
        }
        const data = await fetchPhotos();
        setPhotoUrls(data);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data })
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  useEffect(() => {
    if (photosFolderName !== null) {
      setFilteredPhotoUrls(photoUrls.filter((url) => url.includes(`/${photosFolderName}/`)));
      return;
    }
    setFilteredPhotoUrls(photoUrls);
  }, [photosFolderName, photoUrls]);

  return { loading, filteredPhotoUrls, photoUrls };
}
