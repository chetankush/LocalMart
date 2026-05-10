'use client';
import { useEffect, useState } from 'react';

export function StatusCopyRotator({ storeName }: { storeName: string }) {
  const lines = [
    'Finding your shopkeeper…',
    `Pinging ${storeName}…`,
    'Almost there…',
    'Still waiting — they might be with a customer.',
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((prev) => (prev + 1) % lines.length), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <p
      key={i}
      style={{
        color: '#475569',
        fontSize: 15,
        animation: 'fadeIn 0.5s ease-in',
      }}
    >
      {lines[i]}
    </p>
  );
}
