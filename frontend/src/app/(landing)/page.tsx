import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { VStack } from "@chakra-ui/react";
import { HeroSection } from "./_sections/HeroSection";
import siteConfig from "@/configs/site";

export const metadata: Metadata = {
  title: siteConfig.pages.landing.title,
  description: siteConfig.pages.landing.description,
  openGraph: {
    title: siteConfig.pages.landing.title,
    description: siteConfig.pages.landing.description,
  },
  twitter: {
    title: siteConfig.pages.landing.title,
    description: siteConfig.pages.landing.description,
  },
};

const WalletConnect = dynamic(
  () =>
    import("../_components/WalletConnect").then((mod) => ({
      default: mod.WalletConnect,
    })),
  { ssr: false }
);

export default function Home() {
  return (
    <VStack w={"full"} h={"full"}>
      <HeroSection />
    </VStack>
  );
}
