import type { Metadata } from "next";
import { HStack } from "@chakra-ui/react";
import { ValidatorList } from "./_components/ValidatorList";
import { MarketOverviewBoard } from "./_components/MarketOverviewBoard";
import siteConfig from "@/configs/site";

export const metadata: Metadata = {
  title: "Dashboard",
  description: siteConfig.pages.dashboard.description,
  openGraph: {
    title: siteConfig.pages.dashboard.title,
    description: siteConfig.pages.dashboard.description,
  },
  twitter: {
    title: siteConfig.pages.dashboard.title,
    description: siteConfig.pages.dashboard.description,
  },
};

export default function Page() {
  return (
    <HStack w={"full"} height={"full"} gap={"4"} p={"4"}>
      {/* <MarketOverviewBoard /> */}
      <ValidatorList />
    </HStack>
  );
}
