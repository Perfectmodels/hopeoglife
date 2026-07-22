import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hopeoflife-gabon.com";
const title = "Hope Of Life — Bar Lounge & Restaurant de luxe | Angondjé, Libreville";
const description =
  "Hope Of Life, bar lounge et restaurant de luxe à Antraco, Angondjé. Réservez votre table, découvrez notre carte et nos soirées d'exception.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Hope Of Life",
  },
  description,
  keywords: [
    "restaurant de luxe Angondjé",
    "bar lounge Angondjé",
    "restaurant Antraco",
    "lounge Libreville",
    "réservation restaurant Angondjé",
    "privatisation restaurant Libreville",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Hope Of Life",
    title,
    description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Hope Of Life" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hope Of Life",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a08",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
