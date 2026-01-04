"use client";
import { useStake } from "@/app/hooks/useLiquidStaking";
import { useGetNetworkPAvg } from "@/app/hooks/useValidatorRegistry";
import { Heading, StackProps, VStack } from "@chakra-ui/react";
import { useEffect } from "react";

interface Props extends StackProps {}
export function MarketOverviewBoard(props: Props) {
  const { data, error } = useGetNetworkPAvg();
  const stakeMutation = useStake();

  useEffect(() => {
    console.log("Network PAvg data:", data);
    if (error) {
      console.error("Error fetching Network PAvg data:", error);
    }
  }, [data, error]);

  return (
    <VStack flex={1} h={"full"} rounded={"3xl"} bg={"primary"} p={"4"}>
      <Heading as="h2" size="4xl" fontWeight={"bold"} color={"primary.contrast"}>
        Market Overview Board Component
      </Heading>
    </VStack>
  );
}
