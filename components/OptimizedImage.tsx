'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  sizes,
  priority = false,
  loading = 'lazy'
}: OptimizedImageProps) {
  // Resolve conflict: priority images should not have loading='lazy'
  const resolvedLoading = priority ? 'eager' : loading;
  const [isLoaded, setIsLoaded] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    e.currentTarget.style.opacity = '1';
    if (parentElement) {
      parentElement.classList.remove('animate-pulse');
    }
  };

  const handleRef = (element: HTMLImageElement | null) => {
    if (element && element.parentElement) {
      setParentElement(element.parentElement);
    }
  };

  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  return (
    <Image
      ref={handleRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={`${className} transition-opacity duration-300`}
      sizes={sizes}
      priority={priority}
      loading={resolvedLoading}
      placeholder="blur"
      blurDataURL={blurDataURL}
      onLoad={handleLoad}
      style={{ opacity: isLoaded ? 1 : 0 }}
    />
  );
}