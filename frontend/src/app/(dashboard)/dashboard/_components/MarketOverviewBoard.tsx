"use client";
import { useStake } from "@/app/hooks/useLiquidStaking";
import { useGetNetworkPAvg } from "@/app/hooks/useValidatorRegistry";
import { Button, StackProps, VStack } from "@chakra-ui/react";
import { useEffect } from "react";

interface Props extends StackProps {}
export function MarketOverviewBoard(props: Props) {
  const { data, error } = useGetNetworkPAvg();
  const stakeMutation = useStake();

  useEffect(() => {
    console.log("Network PAvg data:", data);
    if(error) {
      console.error("Error fetching Network PAvg data:", error);
    }
  }, [data, error]);

  useEffect(() => {
    if (stakeMutation.isSuccess) {
      console.log("Stake successful:", stakeMutation.data);
    }
    if (stakeMutation.isError) {
      console.error("Stake error:", stakeMutation.error);
    }
  }, [stakeMutation.isSuccess, stakeMutation.isError, stakeMutation.data, stakeMutation.error]);

  return (
    <VStack flex={1} h={"full"} rounded={"3xl"} bg={"primary"}>
        <Button
            loading={stakeMutation.isPending}
            onClick={() => {
              stakeMutation.mutate({ amount: "100", currentEra: 20798, validatorPublicKey: "0106ca7c39cd272dbf21a86eeb3b36b7c26e2e9b94af64292419f7862936bca2ca" });
            }}
        >
            Stake 10 CSPR
        </Button>
      Market Overview Board Component
    </VStack>
  );
}
