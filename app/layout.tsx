import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/supabase/auth-provider";
import StoreProvider from "@/lib/redux/StoreProvider";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/cart/CartSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NearStore - Local Delivery Platform",
  description: "Order from local vendors and get it delivered to your doorstep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <CartSidebar />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
