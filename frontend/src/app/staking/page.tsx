import type { Metadata } from "next";
import { Flex } from "@chakra-ui/react";
import { MainPanel } from "./_components/MainPanel";
import siteConfig from "@/configs/site";

export const metadata: Metadata = {
  title: "Stake CSPR",
  description: siteConfig.pages.staking.description,
  openGraph: {
    title: siteConfig.pages.staking.title,
    description: siteConfig.pages.staking.description,
  },
  twitter: {
    title: siteConfig.pages.staking.title,
    description: siteConfig.pages.staking.description,
  },
};

export default function Home() {
  return (
      <Flex width="full" minH="calc(100vh - 200px)" px={4} justify={"center"}>
        <MainPanel />
      </Flex>
  );
}
