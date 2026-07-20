import { useState, useEffect, useRef } from "react";

type BlurImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  style?: React.CSSProperties;
};

export function BlurImage({ src, alt, className = "", loading = "lazy", style }: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Check if image is already cached/completed by browser
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div className={`blur-image-wrapper ${isLoaded ? "loaded" : "loading"}`} style={style}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`blur-image-el ${className}`}
      />
    </div>
  );
}
