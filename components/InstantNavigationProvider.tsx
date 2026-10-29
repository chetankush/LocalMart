"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * This component enables instant navigation by:
 * 1. Prefetching all internal links on page load
 * 2. Intercepting link clicks for instant navigation
 * 3. Using native browser navigation for instant feel
 */
export default function InstantNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Prefetch all visible links on page load
    const prefetchAllLinks = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      const uniqueHrefs = new Set<string>();

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (href && !uniqueHrefs.has(href)) {
          uniqueHrefs.add(href);
          router.prefetch(href);
        }
      });
    };

    // Prefetch links after a short delay to not block initial render
    const timer = setTimeout(prefetchAllLinks, 100);

    // Prefetch again when DOM changes (e.g., dropdowns open)
    const observer = new MutationObserver(() => {
      setTimeout(prefetchAllLinks, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname, router]);

  // Intercept all link clicks for instant navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if target has closest method and is a valid HTMLElement
      if (!target || typeof target.closest !== 'function') {
        return;
      }

      const link = target.closest('a[href^="/"]') as HTMLAnchorElement;

      if (link && !link.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          // Use requestAnimationFrame for smoother transition
          requestAnimationFrame(() => {
            router.push(href);
          });
        }
      }
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [router]);

  // Prefetch on hover for instant navigation
  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if target has closest method and is a valid HTMLElement
      if (!target || typeof target.closest !== 'function') {
        return;
      }

      const link = target.closest('a[href^="/"]') as HTMLAnchorElement;

      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          router.prefetch(href);
        }
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, { capture: true });

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
    };
  }, [router]);

  return <>{children}</>;
}
