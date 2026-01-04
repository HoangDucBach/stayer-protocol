import { HStack } from "@chakra-ui/react";
import { ValidatorList } from "./_components/ValidatorList";
import { MarketOverviewBoard } from "./_components/MarketOverviewBoard";

export default function Page() {
  return (
    <HStack w={"full"} height={"full"} gap={"4"} p={"4"}>
      <MarketOverviewBoard />
      {/* <ValidatorList /> */}
    </HStack>
  );
}
