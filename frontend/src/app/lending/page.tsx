import type { Metadata } from "next";
import { Flex } from "@chakra-ui/react";
import { BorrowPanel } from "./_components/BorrowPanel";
import { LeftPanel } from "./_components/LeftPanel";
import siteConfig from "@/configs/site";

export const metadata: Metadata = {
  title: "Borrow cUSD",
  description: siteConfig.pages.lending.description,
  openGraph: {
    title: siteConfig.pages.lending.title,
    description: siteConfig.pages.lending.description,
  },
  twitter: {
    title: siteConfig.pages.lending.title,
    description: siteConfig.pages.lending.description,
  },
};

export default function Home() {
  return (
    <Flex width="full" minH="calc(100vh - 200px)" px={8} gap={8}>
      <LeftPanel flex={1} />
      <BorrowPanel flex={1} />
    </Flex>
  );
}
