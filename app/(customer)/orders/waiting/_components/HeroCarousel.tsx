'use client';
import { useEffect, useState } from 'react';

export function HeroCarousel({ images }: { images: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setI((p) => (p + 1) % images.length), 4000);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div
        style={{
          height: 260,
          background: 'linear-gradient(135deg,#FF9933,#F97316)',
        }}
      />
    );
  }

  return (
    <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
      {images.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + idx}
          src={src}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: idx === i ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(15,23,42,0.5) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}
