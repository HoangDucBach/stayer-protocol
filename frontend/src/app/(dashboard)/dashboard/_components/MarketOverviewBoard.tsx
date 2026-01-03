import { StackProps, VStack } from "@chakra-ui/react";

interface Props extends StackProps {}
export function MarketOverviewBoard(props: Props) {
  return (
    <VStack flex={1} h={"full"} rounded={"3xl"} bg={"primary"}>
      Market Overview Board Component
    </VStack>
  );
}
