import { Box, BoxProps, HStack, Text, VStack } from "@chakra-ui/react";
import { useGetVaultParams, useGetTotalDebt } from "@/app/(dashboard)/hooks/useStayerVault";
import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrency, formatPercentage } from "@/utils";
import { AnimatedNumber } from "./AnimatedNumber";

const MOTE_RATE = new BigNumber(1_000_000_000);

type MarketStatsCardProps = BoxProps;

export function MarketStatsCard(props: MarketStatsCardProps) {
  const { data: vaultParams } = useGetVaultParams();
  const { data: totalDebt } = useGetTotalDebt();

  const totalDebtFormatted = useMemo(() => {
    if (!totalDebt || totalDebt === "0") {
      const debtBN = new BigNumber("1250000000000000000000").dividedBy(
        MOTE_RATE
      );
      return debtBN.toNumber();
    }
    const debtBN = new BigNumber(totalDebt).dividedBy(MOTE_RATE);
    return debtBN.toNumber();
  }, [totalDebt]);

  const liqThreshold = useMemo(() => {
    if (!vaultParams?.liq_threshold) {
      return 0.825;
    }
    return vaultParams.liq_threshold / 100;
  }, [vaultParams]);

  const maxLTV = useMemo(() => {
    if (!vaultParams?.ltv) {
      return 0.75;
    }
    return vaultParams.ltv / 100;
  }, [vaultParams]);

  const stabilityFee = useMemo(() => {
    if (!vaultParams?.stability_fee) {
      return 0.325;
    }
    return vaultParams.stability_fee / 100;
  }, [vaultParams]);

  return (
    <Box bg="primary.solid" borderRadius="32px" w="full" p={8} {...props}>
      <HStack justify="space-between" w="full">
        <VStack align="start" w="full">
          <TextContent
            text="Total Debt"
            animatedValue={totalDebtFormatted}
            formatter={formatCurrency}
          />
          <TextContent
            text="Liq. Threshold"
            animatedValue={liqThreshold}
            formatter={formatPercentage}
          />
        </VStack>
        <VStack align="start" w="full">
          <TextContent
            text="Max LTV"
            animatedValue={maxLTV}
            formatter={formatPercentage}
          />
          <TextContent
            text="Stability"
            animatedValue={stabilityFee}
            formatter={formatPercentage}
          />
        </VStack>
      </HStack>
    </Box>
  );
}

interface TextContentProps {
  text: string;
  animatedValue?: number;
  formatter?: (value: number) => string;
  value?: string;
}

const TextContent = ({
  text,
  animatedValue,
  formatter,
  value,
}: TextContentProps) => {
  return (
    <VStack gap={0} align="flex-start">
      <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
        {text}
      </Text>

      <Text fontSize="2xl" fontWeight="semibold" color="fg.inverted">
        {animatedValue !== undefined && formatter ? (
          <AnimatedNumber value={animatedValue} formatter={formatter} />
        ) : (
          value
        )}
      </Text>
    </VStack>
  );
};