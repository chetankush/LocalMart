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
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F5F7",
};

export const metadata: Metadata = {
  title: "LocalMart - Local Delivery Platform",
  description: "Order from local vendors and get it delivered to your doorstep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
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
