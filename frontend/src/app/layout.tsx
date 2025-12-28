import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import siteConfig from "@/configs/site";

import "./globals.css";
import Provider from "./provider";

const rubik = Rubik({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.app.name,
  description: siteConfig.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.className}`}>
        <div id="root">
          <Provider>
            {children}
          </Provider>
        </div>
      </body>
    </html>
  );
}
