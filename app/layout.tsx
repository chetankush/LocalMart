import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/supabase/auth-provider";
import StoreProvider from "@/lib/redux/StoreProvider";
import { LocationProvider } from "@/context/LocationContext";
import { StoreBrandingProvider } from "@/context/StoreBrandingContext";
import { ConfirmDialogProvider } from "@/hooks/useConfirm";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/cart/CartSidebar";
import NextTopLoader from "nextjs-toploader";

import InstantNavigationProvider from "@/components/InstantNavigationProvider";
import WebVitalsTracker from "@/components/WebVitalsTracker";
import SourceTracker from "@/components/SourceTracker";
import BrokenImageGuard from "@/components/BrokenImageGuard";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: {
    default: "LocalMart – Shop from local shops near you | Home delivery",
    template: "%s",
  },
  description:
    "Order sarees, groceries, medicines and more from real shops in your town. Delivered by the shop itself — pay cash on delivery or UPI.",
  applicationName: "LocalMart",
  openGraph: {
    type: "website",
    siteName: "LocalMart",
    locale: "en_IN",
    title: "LocalMart – Shop from local shops near you",
    description: "Order from real shops in your town. Delivered by the shop — cash on delivery or UPI.",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* A photo that can't load is hidden, not shown broken */}
        <BrokenImageGuard />
        <StoreProvider>
          <AuthProvider>
            <LocationProvider>
              <StoreBrandingProvider>
                <ConfirmDialogProvider>
                <InstantNavigationProvider>
                  <NextTopLoader
                    color="#FF8A1F"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow={false}
                  />
                  <WebVitalsTracker />
                  <SourceTracker />
                  <Navbar />
                  <main className="min-h-screen pb-tabbar">{children}</main>
                  <Footer />
                  <CartSidebar />
                  <Toaster
                    position="top-center"
                    richColors
                    closeButton
                    toastOptions={{
                      style: {
                        fontFamily: "var(--font-system)",
                      },
                    }}
                  />
                </InstantNavigationProvider>
                </ConfirmDialogProvider>
              </StoreBrandingProvider>
            </LocationProvider>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
