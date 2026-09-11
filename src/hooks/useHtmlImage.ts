import { useEffect, useState } from 'react';

const cache = new Map<string, HTMLImageElement>();

export function useHtmlImage(url?: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(url ? cache.get(url) ?? null : null);

  useEffect(() => {
    if (!url) {
      setImg(null);
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setImg(cached);
      return;
    }
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      cache.set(url, image);
      setImg(image);
    };
    image.src = url;
    return () => {
      image.onload = null;
    };
  }, [url]);

  return img;
}
