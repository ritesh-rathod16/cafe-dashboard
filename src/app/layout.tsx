import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Cafe Republic | Fresh Coffee. Cozy Vibes.",
  description: "Experience premium coffee and elegant dining at Cafe Republic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <CartProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}