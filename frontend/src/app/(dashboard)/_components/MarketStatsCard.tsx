import { Box, BoxProps, HStack, Text, VStack } from "@chakra-ui/react";
import { useGetVaultParams, useGetTotalDebt } from "@/app/hooks/useStayerVault";
import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrency, formatPercentage } from "@/utils"

const MOTE_RATE = new BigNumber(1_000_000_000);

type MarketStatsCardProps = BoxProps;

export function MarketStatsCard(props: MarketStatsCardProps) {
  const { data: vaultParams } = useGetVaultParams();
  const { data: totalDebt } = useGetTotalDebt();

  const totalDebtFormatted = useMemo(() => {
    if (!totalDebt || totalDebt === "0") {
      const debtBN = new BigNumber("1250000000000000000000").dividedBy(MOTE_RATE);
      return `${formatCurrency(debtBN.toNumber(), 2).toUpperCase()}`; 
    }
    const debtBN = new BigNumber(totalDebt).dividedBy(MOTE_RATE);
    return `${formatCurrency(debtBN.toNumber(), 2).toUpperCase()}`;
  }, [totalDebt]);

  const liqThreshold = useMemo(() => {
    if (!vaultParams?.liq_threshold) {
      return formatPercentage(0.825, 1);
    }
    return formatPercentage(vaultParams.liq_threshold / 100, 1);
  }, [vaultParams]);

  const maxLTV = useMemo(() => {
    if (!vaultParams?.ltv) {
      return formatPercentage(0.75, 1);
    }
    return formatPercentage(vaultParams.ltv / 100, 1);
  }, [vaultParams]);

  const stabilityFee = useMemo(() => {
    if (!vaultParams?.stability_fee) {
      return formatPercentage(0.325, 1);
    }
    return formatPercentage(vaultParams.stability_fee / 100, 1);
  }, [vaultParams]);

  return (
    <Box bg="primary.solid" borderRadius="32px" w="full" p={8} {...props}>
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
