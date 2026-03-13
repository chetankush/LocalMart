import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
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
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400"],
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
      <body className={`${montserrat.variable} ${roboto.variable} antialiased`}>
        <StoreProvider>
          <AuthProvider>
            <LocationProvider>
              <StoreBrandingProvider>
                <InstantNavigationProvider>
                  <NextTopLoader
                    color="#2563eb"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    showSpinner={false}
                    easing="ease"
                    speed={200}
                    shadow="0 0 10px #2563eb,0 0 5px #2563eb"
                  />
                  <WebVitalsTracker />
                  <Navbar />
                  <main className="min-h-screen">{children}</main>
                  <Footer />
                  <CartSidebar />
                </InstantNavigationProvider>
              </StoreBrandingProvider>
            </LocationProvider>
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
