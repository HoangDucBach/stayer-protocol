import Image from "next/image";
import dynamic from "next/dynamic";
import { Stack, VStack } from "@chakra-ui/react";
import { HeroSection } from "./_sections/HeroSection";

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
