"use client";

import { MarketStatsCard } from "@/app/(dashboard)/_components/MarketStatsCard";
import { StackProps, VStack } from "@chakra-ui/react";
import { PositionCard } from "./PositionCard";

type Props = StackProps;

export function LeftPanel(props: Props) {
  return (
    <VStack w="full" h="full" gap={8} {...props}>
      <MarketStatsCard />
      <PositionCard />
    </VStack>
  );
}
