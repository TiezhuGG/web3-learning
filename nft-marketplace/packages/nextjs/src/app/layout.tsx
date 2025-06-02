import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          {children}
          </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
