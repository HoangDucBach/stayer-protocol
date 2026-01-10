"use client";

import {
  Box,
  Heading,
  HStack,
  Image,
  StackProps,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useClickRef } from "@make-software/csprclick-ui";
import {
  useGetPosition,
  useGetVaultParams,
} from "@/app/(dashboard)/hooks/useStayerVault";
import { useGetPrice } from "@/app/(dashboard)/hooks/usePriceOracle";
import { useGetExchangeRate } from "@/app/(dashboard)/hooks/useLiquidStaking";
import { useMemo } from "react";
import BigNumber from "bignumber.js";
import { Skeleton } from "@/components/ui/skeleton";

const MOTE_RATE = new BigNumber(1_000_000_000);
const DEFAULT_EXCHANGE_RATE = "1000000000";

type Props = StackProps;

function calcCollateralUsd(
  collateral: string,
  exchangeRate: string,
  price: string
): BigNumber {
  return new BigNumber(collateral)
    .multipliedBy(exchangeRate)
    .dividedBy(MOTE_RATE)
    .multipliedBy(price)
    .dividedBy(MOTE_RATE);
}

export function PositionCard(props: Props) {
  const clickRef = useClickRef();

  const { data: position, isLoading: isPositionLoading } = useGetPosition(
    clickRef?.currentAccount?.public_key || "",
    { options: { enabled: !!clickRef?.currentAccount } }
  );
  const { data: vaultParams, isLoading: isVaultParamsLoading } =
    useGetVaultParams();
  const { data: cspr_price, isLoading: isPriceLoading } = useGetPrice();
  const { data: exchangeRate, isLoading: isExchangeRateLoading } =
    useGetExchangeRate();

  const isLoading =
    isPositionLoading ||
    isVaultParamsLoading ||
    isPriceLoading ||
    isExchangeRateLoading;

  const collateralValue = useMemo(() => {
    if (!position?.collateral || !cspr_price) return "0";
    return calcCollateralUsd(
      position.collateral,
      exchangeRate || DEFAULT_EXCHANGE_RATE,
      cspr_price
    ).toFixed(2);
  }, [position, cspr_price, exchangeRate]);

  const debtValue = useMemo(() => {
    if (!position?.debt) return "0";
    return new BigNumber(position.debt).dividedBy(MOTE_RATE).toFixed(2);
  }, [position]);

  const healthFactor = useMemo(() => {
    if (
      !position?.collateral ||
      !position?.debt ||
      !vaultParams?.liq_threshold ||
      !cspr_price
    )
      return 999;

    const debtBN = new BigNumber(position.debt);
    if (debtBN.isZero()) return 999;

    const collateralUsd = calcCollateralUsd(
      position.collateral,
      exchangeRate || DEFAULT_EXCHANGE_RATE,
      cspr_price
    );

    const liqThreshold = new BigNumber(vaultParams.liq_threshold).dividedBy(
      10000
    );

    return collateralUsd
      .multipliedBy(liqThreshold)
      .dividedBy(debtBN.dividedBy(MOTE_RATE))
      .toNumber();
  }, [position, vaultParams, cspr_price, exchangeRate]);

  const maxBorrowCapacity = useMemo(() => {
    if (!position?.collateral || !vaultParams?.ltv || !cspr_price) return "0";

    const collateralUsd = calcCollateralUsd(
      position.collateral,
      exchangeRate || DEFAULT_EXCHANGE_RATE,
      cspr_price
    );

    const ltv = new BigNumber(vaultParams.ltv).dividedBy(10000);
    return collateralUsd.multipliedBy(ltv).toFixed(2);
  }, [position, vaultParams, cspr_price, exchangeRate]);

  const availableToBorrow = useMemo(() => {
    const max = new BigNumber(maxBorrowCapacity);
    const debt = new BigNumber(debtValue);
    const available = max.minus(debt);
    return available.isPositive() ? available.toFixed(2) : "0";
  }, [maxBorrowCapacity, debtValue]);

  if (isLoading) {
    return (
      <VStack
        w="full"
        h="fit-content"
        bg="bg.subtle"
        borderRadius="4xl"
        p="8"
        gap={6}
        align="start"
        {...props}
      >
        <Skeleton height="32px" width="120px" />
        <HStack w="full" justify="space-between">
          <VStack align="start" gap={2}>
            <Skeleton height="16px" width="100px" />
            <Skeleton height="24px" width="150px" />
            <Skeleton height="14px" width="80px" />
          </VStack>
          <VStack align="start" gap={2}>
            <Skeleton height="16px" width="100px" />
            <Skeleton height="24px" width="150px" />
            <Skeleton height="14px" width="80px" />
          </VStack>
        </HStack>
        <Skeleton height="8px" width="full" />
      </VStack>
    );
  }

  return (
    <VStack
      w="full"
      h="fit-content"
      bg="bg.subtle"
      borderRadius="4xl"
      p="8"
      gap={6}
      align="start"
      {...props}
    >
      <Heading size="4xl" mb={1} textAlign="left" fontWeight="semibold">
        Position
      </Heading>
      <HStack w="full" justify="space-between">
        <StatItem
          label="Total Deposits"
          value={`${new BigNumber(position?.collateral || 0).dividedBy(MOTE_RATE).toFixed(2)} ySCSPR`}
          estimateMoneyValue={`$${collateralValue}`}
          imageUrl="/assets/yscspr-token-icon.svg"
        />
        <StatItem
          label="Total Borrows"
          value={`${debtValue} cUSD`}
          estimateMoneyValue={`$${debtValue}`}
          imageUrl="/assets/cusd-token-icon.svg"
        />
      </HStack>
      <HStack w="full" justify="space-between">
        <StatItem
          label="Max Capacity"
          value={`${maxBorrowCapacity} cUSD`}
          imageUrl="/assets/cusd-token-icon.svg"
        />
        <StatItem
          label="Available to Borrow"
          value={`${availableToBorrow} cUSD`}
          imageUrl="/assets/cusd-token-icon.svg"
        />
      </HStack>
      <StatusBar healthFactor={healthFactor} />
    </VStack>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  estimateMoneyValue?: string;
  imageUrl?: string;
  imageAlt?: string;
}

const StatItem = ({
  label,
  value,
  estimateMoneyValue,
  imageUrl,
  imageAlt,
}: StatItemProps) => {
  return (
    <VStack align="start" gap={1}>
      <Heading size="md" color="#AEA28E">
        {label}
      </Heading>
      <HStack gap={4}>
        <Heading size="2xl">{value}</Heading>
        <Image src={imageUrl} alt={imageAlt || "img"} boxSize="32px" />
      </HStack>
      <Text fontSize="md" color="fg">
        ≈ {estimateMoneyValue}
      </Text>
    </VStack>
  );
};

interface StatusBarProps {
  healthFactor?: number;
}

const StatusBar = ({ healthFactor }: StatusBarProps) => {
  const getLevel = () => {
    if (healthFactor === undefined || healthFactor >= 999)
      return { text: "Safe", color: "green.400" };
    if (healthFactor >= 1.5) return { text: "Safe", color: "green.500" };
    if (healthFactor >= 1.0) return { text: "Warning", color: "yellow.500" };
    return { text: "Critical", color: "red.400" };
  };

  const { text: levelText, color: levelColor } = getLevel();
  const barPercent = Math.min(100, Math.max(0, ((healthFactor || 0) / 2) * 100));
  const pct = `${barPercent.toFixed(0)}%`;
  const hfDisplay =
    healthFactor !== undefined && healthFactor < 999
      ? healthFactor.toFixed(2)
      : "∞";

  return (
    <HStack w="full" gap={4}>
      <Text fontSize="xs" fontWeight="medium" color={levelColor}>
        {levelText}
      </Text>
      <Box
        bg="#FCE5CF"
        flex={1}
        h="8px"
        borderRadius="4px"
        overflow="hidden"
        w="full"
      >
        <Box
          bg={levelColor}
          h="8px"
          borderTopLeftRadius="4px"
          borderBottomLeftRadius="4px"
          borderTopRightRadius={pct === "100%" ? "4px" : "0px"}
          borderBottomRightRadius={pct === "100%" ? "4px" : "0px"}
          w={pct}
        />
      </Box>
      <Text fontSize="xs" fontWeight="medium" color="text.fg">
        HF: {hfDisplay}
      </Text>
    </HStack>
  );
};
