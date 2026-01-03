import { LendingMarket } from "@/app/(dashboard)/_components/LendingMarket";
import { StackProps, VStack } from "@chakra-ui/react";
import { PositionCard } from "./PositionCard";

type Props = StackProps;

export function LeftPanel(props: Props) {
  return (
    <VStack w="full" h="full" gap={8} {...props}>
      <LendingMarket />
      <PositionCard />
    </VStack>
  );
}
