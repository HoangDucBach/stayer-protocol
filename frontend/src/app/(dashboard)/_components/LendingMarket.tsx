import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useGetVaultParams, useGetTotalDebt } from "@/app/hooks/useStayerVault";
import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatPercentage } from "@/utils";

const MOTE_RATE = new BigNumber(1_000_000_000);

export function LendingMarket() {
  // Fetch vault parameters
  const { data: vaultParams } = useGetVaultParams();
  
  // Fetch total debt
  const { data: totalDebt } = useGetTotalDebt();

  const totalDebtFormatted = useMemo(() => {
    if (!totalDebt) return "$0";
    const debtBN = new BigNumber(totalDebt).dividedBy(MOTE_RATE);
    return `$${debtBN.toFormat(0)}`;
  }, [totalDebt]);

  const liqThreshold = useMemo(() => {
    if (!vaultParams?.liq_threshold) return "0%";
    return formatPercentage(vaultParams.liq_threshold / 100, 0);
  }, [vaultParams]);

  const maxLTV = useMemo(() => {
    if (!vaultParams?.ltv) return "0%";
    return formatPercentage(vaultParams.ltv / 100, 1);
  }, [vaultParams]);

  const stabilityFee = useMemo(() => {
    if (!vaultParams?.stability_fee) return "0%";
    return formatPercentage(vaultParams.stability_fee / 100, 1);
  }, [vaultParams]);

  return (
    <Box bg="primary.solid" borderRadius="32px" w="full" p={8}>
      <HStack justify="space-between" w="full">
        <VStack align="start" w="full">
          <TextContent text="Total Debt" value={totalDebtFormatted} />
          <TextContent text="Liq. Threshold" value={liqThreshold} />
        </VStack>
        <VStack align="start" w="full">
          <TextContent text="Max LTV" value={maxLTV} />
          <TextContent text="Stability" value={stabilityFee} />
        </VStack>
      </HStack>
    </Box>
  );
}

interface TextContentProps {
  text: string;
  value: string;
}

const TextContent = ({ text, value }: TextContentProps) => {
  return (
    <VStack gap={0} align="flex-start">
      <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
        {text}
      </Text>
      <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
        {value}
      </Text>
    </VStack>
  );
};
