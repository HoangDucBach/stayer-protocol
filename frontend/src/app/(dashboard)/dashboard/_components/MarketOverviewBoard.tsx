"use client";
import { useStake } from "@/app/hooks/useLiquidStaking";
import { useGetNetworkPAvg } from "@/app/hooks/useValidatorRegistry";
import { Box, Heading, StackProps, Text, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { MarketStatsCard } from "../../_components/MarketStatsCard";
import { formatCurrency } from "@/utils";

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
    <VStack
      flex={1}
      h={"full"}
      rounded={"3xl"}
      justifyContent={"space-between"}
      alignItems={"start"}
      bg={"primary"}
      p={"8"}
    >
      <Box>
        <Heading as="h2" size="6xl" fontWeight={"bold"} color={"fg.inverted"}>
          MARKET OVERVIEW
        </Heading>
        <Text fontSize={"4xl"} fontWeight={"semibold"} color={"fg"}>
        TVL: {formatCurrency(1740000, 2).toUpperCase()}
      </Text>
      </Box>
      <MarketStatsCard p={0}/>
    </VStack>
  );
}
