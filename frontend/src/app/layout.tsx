import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import siteConfig from "@/configs/site";

import "./globals.css";
import Provider from "./provider";

const rubik = Rubik({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.app.url),
  title: {
    default: siteConfig.app.name,
    template: `%s | ${siteConfig.app.name}`,
  },
  description: siteConfig.app.description,
  keywords: siteConfig.keywords,
  authors: [{ name: "Wynn Chill Lab" }],
  creator: "Stayer Protocol",
  publisher: "Stayer Protocol",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.app.url,
    siteName: siteConfig.app.name,
    title: siteConfig.app.name,
    description: siteConfig.app.description,
    images: [
      {
        url: siteConfig.app.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.app.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.app.name,
    description: siteConfig.app.description,
    images: [siteConfig.app.ogImage],
    creator: siteConfig.app.twitterHandle,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.className}`}>
        <div id="root" style={{ height: "100vh", width: "100%" }}>
          <Provider>{children}</Provider>
        </div>
      </body>
    </html>
  );
}
