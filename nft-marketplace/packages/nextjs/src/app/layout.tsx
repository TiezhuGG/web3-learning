import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
          </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
