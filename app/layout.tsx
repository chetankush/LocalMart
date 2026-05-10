import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/supabase/auth-provider";
import StoreProvider from "@/lib/redux/StoreProvider";
import { LocationProvider } from "@/context/LocationContext";
import { StoreBrandingProvider } from "@/context/StoreBrandingContext";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/cart/CartSidebar";
import NextTopLoader from "nextjs-toploader";

import InstantNavigationProvider from "@/components/InstantNavigationProvider";
import WebVitalsTracker from "@/components/WebVitalsTracker";
import { Toaster } from "sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

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
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <StoreProvider>
          <AuthProvider>
            <LocationProvider>
              <StoreBrandingProvider>
                <InstantNavigationProvider>
                  <NextTopLoader
                    color="#6B7FFF"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #6B7FFF,0 0 5px #6B7FFF"
                  />
                  <WebVitalsTracker />
                  <Navbar />
                  <main className="min-h-screen">{children}</main>
                  <Footer />
                  <CartSidebar />
                  <Toaster
                    position="top-center"
                    richColors
                    closeButton
                    toastOptions={{
                      style: {
                        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      },
                    }}
                  />
                </InstantNavigationProvider>
              </StoreBrandingProvider>
            </LocationProvider>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
