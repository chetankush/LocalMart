"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // This will trigger when pathname changes (navigation complete)
    setIsNavigating(false);
  }, [pathname]);

  // Listen for navigation start
  useEffect(() => {
    const handleStart = () => setIsNavigating(true);

    // Create a custom event listener for navigation
    window.addEventListener('navigationStart', handleStart);

    return () => {
      window.removeEventListener('navigationStart', handleStart);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-[#FF9933]/20">
      <div className="h-full bg-[#FF9933] animate-progress-bar"></div>
    </div>
  );
}
